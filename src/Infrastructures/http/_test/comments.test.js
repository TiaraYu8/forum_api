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
  let threadId;

  beforeAll(async () => {
    const passwordHash = new BcryptPasswordHash(bcrypt);

    // Tambah user
    await UsersTableTestHelper.addUser({
      id: 'user-123',
      username: 'dicoding',
      password: await passwordHash.hash('secret_password'),
      fullname: 'Dicoding Indonesia',
    });

    // Buat server dan login untuk dapatkan accessToken
    const server = await createServer(container);
    const loginResponse = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: 'dicoding',
        password: 'secret_password',
      },
    });

    const loginResponseJson = JSON.parse(loginResponse.payload);
    accessToken = loginResponseJson.data.accessToken;

    // Tambah thread untuk testing comment
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
  });

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  it('should response 201 and persisted comment', async () => {
    const server = await createServer(container);
    const requestPayload = {
      content: 'Ini komentar pertama',
    };

    const response = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: requestPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(201);
    expect(responseJson.status).toEqual('success');
    expect(responseJson.data.addedComment).toBeDefined();
    expect(responseJson.data.addedComment.content).toEqual(requestPayload.content);

    // Verifikasi data tersimpan di database
    const comments = await CommentsTableTestHelper.findCommentById(responseJson.data.addedComment.id);
    expect(comments).toHaveLength(1);
  });

  it('should response 400 when request payload not contain needed property', async () => {
    const server = await createServer(container);
    const requestPayload = {
      // content tidak ada
    };

    const response = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: requestPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(400);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
  });

  it('should response 400 when request payload not meet data type specification', async () => {
    const server = await createServer(container);
    const requestPayload = {
      content: 12345, // harus string
    };

    const response = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: requestPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(400);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
  });

  it('should response 200 and delete comment correctly', async () => {
    const server = await createServer(container);

    // Tambah comment terlebih dahulu
    const addCommentResponse = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: {
        content: 'Komentar yang akan dihapus',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(addCommentResponse.statusCode).toEqual(201);
    
    const addCommentJson = JSON.parse(addCommentResponse.payload);
    const commentId = addCommentJson.data.addedComment.id;
    expect(commentId).toBeDefined();

    console.log('[comment.test] commentId: ', commentId);

    const commentsBeforeDelete = await CommentsTableTestHelper.findCommentById(commentId);
    expect(commentsBeforeDelete).toHaveLength(1);

    // Delete comment
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/threads/${threadId}/comments/${commentId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const deleteResponseJson = JSON.parse(deleteResponse.payload);

    console.log('Delete response:', deleteResponse.statusCode, deleteResponseJson);

    expect(deleteResponse.statusCode).toEqual(200);
    expect(deleteResponseJson.status).toEqual('success');

    // Verifikasi comment sudah terhapus
    const comments = await CommentsTableTestHelper.findCommentById(commentId);
    expect(comments).toHaveLength(0);
  });

  it('should response 404 when delete comment that does not exist', async () => {
    const server = await createServer(container);

    const response = await server.inject({
      method: 'DELETE',
      url: `/threads/${threadId}/comments/comment-xyz`, // comment id yang tidak ada
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(404);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
  });
});
