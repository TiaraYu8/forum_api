const createServer = require('../createServer');
const pool = require('../../../Infrastructures/database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const container = require('../../container');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const BcryptPasswordHash = require ('../../security/BcryptPasswordHash');
const bcrypt = require('bcrypt');

describe('Threads endpoint', () => {
  let accessToken;
  let threadId;

  beforeAll(async () => {
    const passwordHash = new BcryptPasswordHash(bcrypt);

    await UsersTableTestHelper.addUser({
      id: 'user-123',
      username: 'dicoding',
      password: await passwordHash.hash('secret_password'),
      fullname: 'Dicoding Indonesia',
    });

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

    const threadResponse = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: {
        title: 'Thread untuk test detail',
        body: 'Body thread untuk test detail',
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

  it('should response 201 and persisted thread', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      title: 'Test Thread',
      body: 'Test Body',
    }; 

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: requestPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(201);
    expect(responseJson.status).toEqual('success');
    expect(responseJson.data.addedThread).toBeDefined();
    expect(responseJson.data.addedThread.title).toEqual(requestPayload.title);

    // Verifikasi data tersimpan di database
    const threads = await ThreadsTableTestHelper.findThreadsById(responseJson.data.addedThread.id);
    expect(threads).toHaveLength(1);
  });

  it('should response 400 when request payload not contain needed property', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      body: 'Test Body', // title tidak ada
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/threads',
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
  });

  it('should response 400 when request payload not meet data type specification', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      title: 12345, // harus string
      body: 'Test Body',
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/threads',
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
  });

  it('should response 400 when title more than 101 character', async () => {
    // Arrange
    const server = await createServer(container);
    const longTitle = 'a'.repeat(102);
    const requestPayload = {
      title: longTitle,
      body: 'Test Body',
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/threads',
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
  });

  it('should response 200 and return thread detail correctly', async () => {
    const server = await createServer(container);

    console.log('ThreadId from beforeAll:', threadId);

    const existingThreads = await ThreadsTableTestHelper.findThreadsById(threadId);
    console.log('Existing threads in DB:', existingThreads);
    // Tambah comment ke thread
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      content: 'Sebuah komentar',
      thread_id: threadId,
      owner: 'user-123',
      is_delete: false,
      created_at: '2021-08-08T07:22:33.555Z',
    });

    // Tambah comment yang sudah dihapus
    await CommentsTableTestHelper.addComment({
      id: 'comment-456',
      content: 'Komentar yang dihapus',
      thread_id: threadId,
      owner: 'user-123',
      is_delete: true,
      created_at: '2021-08-08T07:26:21.338Z',
    });

    const response = await server.inject({
      method: 'GET',
      url: `/threads/${threadId}`,
    });

    console.log('Response status:', response.statusCode);
    console.log('Response payload:', response.payload);

    
    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(200);
    expect(responseJson.status).toEqual('success');
    expect(responseJson.data.thread).toBeDefined();
    expect(responseJson.data.thread.id).toEqual(threadId);
    expect(responseJson.data.thread.comments).toHaveLength(2);
    expect(responseJson.data.thread.comments[1].content).toEqual('**komentar telah dihapus**');
  });

  it('should response 404 when thread not found', async () => {
    const server = await createServer(container);

    const response = await server.inject({
      method: 'GET',
      url: '/threads/thread-xyz',
    });

    const responseJson = JSON.parse(response.payload);
    expect(response.statusCode).toEqual(404);
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
  });

});
