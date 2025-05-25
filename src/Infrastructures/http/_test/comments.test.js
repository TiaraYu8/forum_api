const createServer = require('../createServer');
const pool = require('../../../Infrastructures/database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const BcryptPasswordHash = require('../../security/BcryptPasswordHash');
const bcrypt = require('bcrypt');

describe('Comments endpoint', () => {
  let accessToken;
  let otherAccessToken;
  let threadId;
  let passwordHash;

  beforeEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

    passwordHash = new BcryptPasswordHash(bcrypt);

    await UsersTableTestHelper.addUser({
      id: 'user-123',
      username: 'dicoding',
      password: await passwordHash.hash('secret_password'),
      fullname: 'Dicoding Indonesia',
    });

    await UsersTableTestHelper.addUser({
      id: 'user-456',
      username: 'otheruser',
      password: await passwordHash.hash('secret_password'),
      fullname: 'Other User',
    });

    const server = await createServer(container);

    // Login user pertama
    const loginResponse1 = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: 'dicoding',
        password: 'secret_password',
      },
    });

    const loginResponseJson1 = JSON.parse(loginResponse1.payload);
    accessToken = loginResponseJson1.data.accessToken;

    // Login user kedua
    const loginResponse2 = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: 'otheruser',
        password: 'secret_password',
      },
    });

    const loginResponseJson2 = JSON.parse(loginResponse2.payload);
    otherAccessToken = loginResponseJson2.data.accessToken;

    // Buat thread untuk testing
    const threadResponse = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: {
        title: 'Thread untuk komentar',
        body: 'Body thread',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const threadResponseJson = JSON.parse(threadResponse.payload);
    threadId = threadResponseJson.data.addedThread.id;
  });

  afterEach(async () => {
    // Cleanup setelah setiap test
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should response 201 and persisted comment', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      content: 'Ini komentar pertama',
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: requestPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(201);
    expect(responseJson.status).toEqual('success');
    expect(responseJson.data.addedComment).toBeDefined();
    
    expect(responseJson.data.addedComment).toEqual({
      id: expect.any(String),
      content: requestPayload.content,
      owner: 'user-123',
    });

    const comments = await CommentsTableTestHelper.findCommentById(responseJson.data.addedComment.id);
    expect(comments).toHaveLength(1);
    expect(comments[0]).toEqual({
      id: responseJson.data.addedComment.id,
      content: requestPayload.content,
      thread_id: threadId,
      owner: 'user-123',
      is_delete: false,
      created_at: expect.any(Date),
    });
  });

  it('should response 400 when request payload not contain needed property', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      // Explicitly empty - content tidak ada
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: requestPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(400);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
    expect(typeof responseJson.message).toBe('string');
  });

  it('should response 400 when request payload not meet data type specification', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      content: 12345, // Explicitly wrong type - harus string
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: requestPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(400);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
    expect(typeof responseJson.message).toBe('string');
  });

  it('should response 200 and delete comment correctly', async () => {
    // Arrange
    const server = await createServer(container);

    const commentPayload = {
      content: 'Komentar yang akan dihapus',
    };

    const addCommentResponse = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: commentPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(addCommentResponse.statusCode).toEqual(201);
    
    const addCommentJson = JSON.parse(addCommentResponse.payload);
    const commentId = addCommentJson.data.addedComment.id;
    expect(commentId).toBeDefined();

    const commentsBeforeDelete = await CommentsTableTestHelper.findCommentById(commentId);
    expect(commentsBeforeDelete).toHaveLength(1);
    expect(commentsBeforeDelete[0].is_delete).toBe(false);

    // Action
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/threads/${threadId}/comments/${commentId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const deleteResponseJson = JSON.parse(deleteResponse.payload);
    expect(deleteResponse.statusCode).toEqual(200);
    expect(deleteResponseJson.status).toEqual('success');
    expect(deleteResponseJson.data).toBeUndefined();

    const verification = await CommentsTableTestHelper.verifyCommentSoftDeleted(commentId);
    expect(verification).toEqual({
      exists: true,
      isSoftDeleted: true,
      comment: expect.objectContaining({
        id: commentId,
        content: commentPayload.content,
        is_delete: true,
      }),
    });
  });

  it('should response 404 when delete comment that does not exist', async () => {
    // Arrange
    const server = await createServer(container);
    const nonExistentCommentId = 'comment-xyz';

    // Action
    const response = await server.inject({
      method: 'DELETE',
      url: `/threads/${threadId}/comments/${nonExistentCommentId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(404);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
    expect(typeof responseJson.message).toBe('string');
  });

  it('should response 403 when user is not the owner', async () => {
    // Arrange
    const server = await createServer(container);
    
    const commentPayload = {
      content: 'Komentar milik user pertama',
    };

    const addCommentResponse = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: commentPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    expect(addCommentResponse.statusCode).toEqual(201);
    const commentId = JSON.parse(addCommentResponse.payload).data.addedComment.id;

    const comment = await CommentsTableTestHelper.findCommentById(commentId);
    expect(comment[0].owner).toEqual('user-123');

    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/threads/${threadId}/comments/${commentId}`,
      headers: {
        Authorization: `Bearer ${otherAccessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(deleteResponse.payload);
    expect(deleteResponse.statusCode).toEqual(403);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
    expect(typeof responseJson.message).toBe('string');

    const commentAfterFailedDelete = await CommentsTableTestHelper.findCommentById(commentId);
    expect(commentAfterFailedDelete).toHaveLength(1);
    expect(commentAfterFailedDelete[0].is_delete).toBe(false);
  });
});
