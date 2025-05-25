const createServer = require('../createServer');
const pool = require('../../../Infrastructures/database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const container = require('../../container');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const BcryptPasswordHash = require('../../security/BcryptPasswordHash');
const bcrypt = require('bcrypt');

describe('Threads endpoint', () => {
  let accessToken;
  let passwordHash;

  beforeAll(async () => {
    passwordHash = new BcryptPasswordHash(bcrypt);
  });

  beforeEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

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
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
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
    expect(responseJson).toEqual({
      status: 'success',
      data: {
        addedThread: {
          id: expect.stringMatching(/^thread-/),
          title: requestPayload.title,
          owner: 'user-123',
        },
      },
    });

    // Database verification
    const threads = await ThreadsTableTestHelper.findThreadsById(responseJson.data.addedThread.id);
    expect(threads).toHaveLength(1);
    expect(threads[0]).toEqual({
      id: responseJson.data.addedThread.id,
      title: requestPayload.title,
      body: requestPayload.body,
      owner: 'user-123',
      created_at: expect.any(Date),
    });
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
    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/tidak dapat membuat thread|properti yang dibutuhkan|tidak ada/i);
    
    expect(responseJson.message).toEqual('tidak dapat membuat thread karena properti yang dibutuhkan tidak ada');
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
    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/tidak dapat membuat thread|tipe data|tidak sesuai/i);
    
    expect(responseJson.message).toEqual('tidak dapat membuat thread karena tipe data tidak sesuai');
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
    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/tidak dapat membuat thread|karakter.*melebihi|batas limit/i);
  });

  it('should response 200 and return thread detail correctly', async () => {
    // Arrange
    const server = await createServer(container);

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
    const threadId = threadResponseJson.data.addedThread.id;

    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      content: 'Sebuah komentar',
      thread_id: threadId,
      owner: 'user-123',
      is_delete: false,
      created_at: '2021-08-08T07:22:33.555Z',
    });

    await CommentsTableTestHelper.addComment({
      id: 'comment-456',
      content: 'Komentar yang dihapus',
      thread_id: threadId,
      owner: 'user-123',
      is_delete: true,
      created_at: '2021-08-08T07:26:21.338Z',
    });

    // Action
    const response = await server.inject({
      method: 'GET',
      url: `/threads/${threadId}`,
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    
    expect(response.statusCode).toEqual(200);
    expect(responseJson).toEqual({
      status: 'success',
      data: {
        thread: {
          id: threadId,
          title: 'Thread untuk test detail',
          body: 'Body thread untuk test detail',
          username: 'dicoding',
          date: expect.any(String),
          comments: [
            {
              id: 'comment-123',
              username: 'dicoding',
              content: 'Sebuah komentar',
              date: expect.any(String),
            },
            {
              id: 'comment-456',
              username: 'dicoding',
              content: '**komentar telah dihapus**',
              date: expect.any(String),
            },
          ],
        },
      },
    });
  });

  it('should response 404 when thread not found', async () => {
    // Arrange
    const server = await createServer(container);
    const nonExistentThreadId = 'thread-xyz';

    // Action
    const response = await server.inject({
      method: 'GET',
      url: `/threads/${nonExistentThreadId}`,
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    
    expect(response.statusCode).toEqual(404);
    expect(responseJson).toEqual({
      status: 'fail',
      message: expect.any(String),
    });

    expect(responseJson.message).toMatch(/thread.*tidak ditemukan|not found/i);
  });

  it('should response 200 and return thread detail without comments', async () => {
    // Arrange
    const server = await createServer(container);

    const threadResponse = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: {
        title: 'Thread tanpa komentar',
        body: 'Body thread tanpa komentar',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const threadResponseJson = JSON.parse(threadResponse.payload);
    const threadId = threadResponseJson.data.addedThread.id;

    // Action
    const response = await server.inject({
      method: 'GET',
      url: `/threads/${threadId}`,
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    
    expect(response.statusCode).toEqual(200);
    expect(responseJson).toEqual({
      status: 'success',
      data: {
        thread: {
          id: threadId,
          title: 'Thread tanpa komentar',
          body: 'Body thread tanpa komentar',
          username: 'dicoding',
          date: expect.any(String),
          comments: [],
        },
      },
    });
  });

  it('should response 401 when creating thread without authentication', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      title: 'Unauthorized Thread',
      body: 'Unauthorized Body',
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: requestPayload,
      // No Authorization header
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    
    expect(response.statusCode).toEqual(401);
    
    expect(responseJson).toHaveProperty('statusCode', 401);
    expect(responseJson).toHaveProperty('error');
    expect(responseJson).toHaveProperty('message');
    expect(typeof responseJson.error).toBe('string');
    expect(typeof responseJson.message).toBe('string');
  });

  it('should response 401 when creating thread with invalid token', async () => {
    // Arrange
    const server = await createServer(container);
    const requestPayload = {
      title: 'Invalid Token Thread',
      body: 'Invalid Token Body',
    };

    // Action
    const response = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: requestPayload,
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    
    expect(response.statusCode).toEqual(401);
    
    expect(responseJson).toHaveProperty('statusCode', 401);
    expect(responseJson).toHaveProperty('error');
    expect(responseJson).toHaveProperty('message');
    
    if (responseJson.attributes) {
      expect(responseJson.attributes).toHaveProperty('error');
      expect(typeof responseJson.attributes.error).toBe('string');
    }
    
    expect(responseJson).toEqual(expect.objectContaining({
      statusCode: 401,
      error: expect.any(String),
      message: expect.any(String),
    }));
  });

  it('should response 404 when accessing thread with empty ID', async () => {
    // Arrange
    const server = await createServer(container);

    // Action
    const response = await server.inject({
      method: 'GET',
      url: '/threads/',
    });

    // Assert
    expect(response.statusCode).toEqual(404);
  });

  it('should response 200 and return thread with multiple comments correctly ordered', async () => {
    // Arrange
    const server = await createServer(container);

    const threadResponse = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: {
        title: 'Thread dengan banyak komentar',
        body: 'Body thread dengan banyak komentar',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const threadResponseJson = JSON.parse(threadResponse.payload);
    const threadId = threadResponseJson.data.addedThread.id;

    // Add multiple comments with different timestamps
    await CommentsTableTestHelper.addComment({
      id: 'comment-001',
      content: 'Komentar pertama',
      thread_id: threadId,
      owner: 'user-123',
      is_delete: false,
      created_at: '2021-08-08T07:20:00.000Z',
    });

    await CommentsTableTestHelper.addComment({
      id: 'comment-002',
      content: 'Komentar kedua yang dihapus',
      thread_id: threadId,
      owner: 'user-123',
      is_delete: true,
      created_at: '2021-08-08T07:25:00.000Z',
    });

    await CommentsTableTestHelper.addComment({
      id: 'comment-003',
      content: 'Komentar ketiga',
      thread_id: threadId,
      owner: 'user-123',
      is_delete: false,
      created_at: '2021-08-08T07:30:00.000Z',
    });

    // Action
    const response = await server.inject({
      method: 'GET',
      url: `/threads/${threadId}`,
    });

    // Assert
    const responseJson = JSON.parse(response.payload);
    const thread = responseJson.data.thread;
    
    expect(response.statusCode).toEqual(200);
    expect(thread.comments).toHaveLength(3);
    
    // Verify ordering by timestamp
    expect(thread.comments[0].id).toEqual('comment-001');
    expect(thread.comments[0].content).toEqual('Komentar pertama');
    
    expect(thread.comments[1].id).toEqual('comment-002');
    expect(thread.comments[1].content).toEqual('**komentar telah dihapus**');
    
    expect(thread.comments[2].id).toEqual('comment-003');
    expect(thread.comments[2].content).toEqual('Komentar ketiga');
    
    // Verify timestamp ordering
    const firstDate = new Date(thread.comments[0].date);
    const secondDate = new Date(thread.comments[1].date);
    const thirdDate = new Date(thread.comments[2].date);
    
    expect(firstDate.getTime()).toBeLessThan(secondDate.getTime());
    expect(secondDate.getTime()).toBeLessThan(thirdDate.getTime());
  });
});
