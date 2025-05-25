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
    expect(responseJson).toHaveProperty('status', 'success');
    expect(responseJson).toHaveProperty('data');
    expect(responseJson.data).toHaveProperty('addedComment');
    
    const addedComment = responseJson.data.addedComment;
    expect(addedComment).toHaveProperty('id');
    expect(typeof addedComment.id).toBe('string');
    expect(addedComment.id).toMatch(/^comment-/);
    expect(addedComment).toHaveProperty('content', requestPayload.content);
    expect(typeof addedComment.content).toBe('string');
    expect(addedComment).toHaveProperty('owner', 'user-123');
    expect(typeof addedComment.owner).toBe('string');

    expect(addedComment).toEqual({
      id: expect.stringMatching(/^comment-/),
      content: requestPayload.content,
      owner: 'user-123',
    });

    expect(responseJson).toEqual({
      status: 'success',
      data: {
        addedComment: {
          id: expect.stringMatching(/^comment-/),
          content: requestPayload.content,
          owner: 'user-123',
        },
      },
    });

    const comments = await CommentsTableTestHelper.findCommentById(addedComment.id);
    expect(comments).toHaveLength(1);
    
    const dbComment = comments[0];
    expect(dbComment).toHaveProperty('id', addedComment.id);
    expect(typeof dbComment.id).toBe('string');
    expect(dbComment).toHaveProperty('content', requestPayload.content);
    expect(typeof dbComment.content).toBe('string');
    expect(dbComment).toHaveProperty('thread_id', threadId);
    expect(typeof dbComment.thread_id).toBe('string');
    expect(dbComment).toHaveProperty('owner', 'user-123');
    expect(typeof dbComment.owner).toBe('string');
    expect(dbComment).toHaveProperty('is_delete', false);
    expect(typeof dbComment.is_delete).toBe('boolean');
    expect(dbComment).toHaveProperty('created_at');
    expect(dbComment.created_at).toBeInstanceOf(Date);

    expect(dbComment).toEqual({
      id: addedComment.id,
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
    expect(responseJson).toHaveProperty('status', 'fail');
    expect(responseJson).toHaveProperty('message');
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson.message.length).toBeGreaterThan(0);
    expect(responseJson).not.toHaveProperty('data');

    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/tidak dapat membuat comment|properti yang dibutuhkan|tidak ada/i);
    
    expect(responseJson.message).toEqual('tidak dapat membuat comment karena properti yang dibutuhkan tidak ada');
  });

  it('should response 400 when request payload not meet data type specification', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      content: 12345, 
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
    expect(responseJson).toHaveProperty('status', 'fail');
    expect(responseJson).toHaveProperty('message');
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson).not.toHaveProperty('data');

    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/tidak dapat membuat comment|tipe data|tidak sesuai/i);
    
    expect(responseJson.message).toEqual('tidak dapat membuat comment karena tipe data tidak sesuai');
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
    expect(commentsBeforeDelete[0]).toEqual({
      id: commentId,
      content: commentPayload.content,
      thread_id: threadId,
      owner: 'user-123',
      is_delete: false,
      created_at: expect.any(Date),
    });

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
    expect(deleteResponseJson).toHaveProperty('status', 'success');
    expect(deleteResponseJson).not.toHaveProperty('data');

    expect(deleteResponseJson).toEqual({
      status: 'success',
    });

    const verification = await CommentsTableTestHelper.verifyCommentSoftDeleted(commentId);
    expect(verification).toHaveProperty('exists', true);
    expect(typeof verification.exists).toBe('boolean');
    expect(verification).toHaveProperty('isSoftDeleted', true);
    expect(typeof verification.isSoftDeleted).toBe('boolean');
    expect(verification).toHaveProperty('comment');
    expect(verification.comment).not.toBeNull();

    expect(verification).toEqual({
      exists: true,
      isSoftDeleted: true,
      comment: expect.objectContaining({
        id: commentId,
        content: commentPayload.content,
        thread_id: threadId,
        owner: 'user-123',
        is_delete: true,
        created_at: expect.any(Date),
      }),
    });

    const activeComments = await CommentsTableTestHelper.findCommentById(commentId);
    expect(Array.isArray(activeComments)).toBe(true);
    expect(activeComments).toHaveLength(0);
    expect(activeComments).toEqual([]);
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
    expect(responseJson).toHaveProperty('status', 'fail');
    expect(responseJson).toHaveProperty('message');
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson.message.length).toBeGreaterThan(0);
    expect(responseJson).not.toHaveProperty('data');

    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/komentar.*tidak ditemukan|comment.*not found/i);
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
    expect(comment).toHaveLength(1);
    expect(comment[0]).toEqual({
      id: commentId,
      content: commentPayload.content,
      thread_id: threadId,
      owner: 'user-123',
      is_delete: false,
      created_at: expect.any(Date),
    });

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
    expect(responseJson).toHaveProperty('status', 'fail');
    expect(responseJson).toHaveProperty('message');
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson.message.length).toBeGreaterThan(0);
    expect(responseJson).not.toHaveProperty('data');

    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/tidak berhak|access|authorization|forbidden/i);

    const commentAfterFailedDelete = await CommentsTableTestHelper.findCommentById(commentId);
    expect(commentAfterFailedDelete).toHaveLength(1);
    expect(commentAfterFailedDelete[0]).toEqual({
      id: commentId,
      content: commentPayload.content,
      thread_id: threadId,
      owner: 'user-123',
      is_delete: false,
      created_at: expect.any(Date),
    });
  });

  it('should response 404 when adding comment to non-existent thread', async () => {
    // Arrange
    const server = await createServer(container);
    const nonExistentThreadId = 'thread-xyz';
    const requestPayload = {
      content: 'Komentar untuk thread yang tidak ada',
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: `/threads/${nonExistentThreadId}/comments`,
      payload: requestPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    
    expect(response.statusCode).toEqual(404);
    expect(responseJson).toHaveProperty('status', 'fail');
    expect(responseJson).toHaveProperty('message');
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson).not.toHaveProperty('data');

    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/thread.*tidak ditemukan|thread.*not found/i);
  });

  it('should response 401 when adding comment without authentication', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      content: 'Unauthorized comment',
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: requestPayload,
      // No Authorization header
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    
    expect(response.statusCode).toEqual(401);
    expect(responseJson).toHaveProperty('statusCode', 401);
    expect(responseJson).toHaveProperty('error');
    expect(responseJson).toHaveProperty('message');
  });

  it('should response 401 when adding comment with invalid token', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      content: 'Invalid token comment',
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: requestPayload,
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    
    expect(response.statusCode).toEqual(401);
    expect(responseJson).toEqual(expect.objectContaining({
      statusCode: 401,
      error: expect.any(String),
      message: expect.any(String),
    }));
  });

  it('should response 400 when content is empty string', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      content: '', // Empty string
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
    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });
  });

  it('should response 201 and handle multiple comments correctly', async () => {
    // Arrange
    const server = await createServer(container);
    
    const firstCommentPayload = {
      content: 'Komentar pertama',
    };
    
    const secondCommentPayload = {
      content: 'Komentar kedua',
    };

    // Action - Add first comment
    const firstResponse = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: firstCommentPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Action - Add second comment
    const secondResponse = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: secondCommentPayload,
      headers: {
        Authorization: `Bearer ${otherAccessToken}`,
      },
    });

    // Assert
    const firstResponseJson = JSON.parse(firstResponse.payload);
    const secondResponseJson = JSON.parse(secondResponse.payload);
    
    expect(firstResponse.statusCode).toEqual(201);
    expect(secondResponse.statusCode).toEqual(201);
    
    expect(firstResponseJson.data.addedComment.content).toEqual('Komentar pertama');
    expect(firstResponseJson.data.addedComment.owner).toEqual('user-123');
    
    expect(secondResponseJson.data.addedComment.content).toEqual('Komentar kedua');
    expect(secondResponseJson.data.addedComment.owner).toEqual('user-456');
    
    // Verify both comments exist in database
    const firstComment = await CommentsTableTestHelper.findCommentById(firstResponseJson.data.addedComment.id);
    const secondComment = await CommentsTableTestHelper.findCommentById(secondResponseJson.data.addedComment.id);
    
    expect(firstComment).toHaveLength(1);
    expect(secondComment).toHaveLength(1);
    expect(firstComment[0].thread_id).toEqual(threadId);
    expect(secondComment[0].thread_id).toEqual(threadId);
  });
});
