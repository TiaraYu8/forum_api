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
    expect(responseJson.status).toEqual('success');
    expect(responseJson.data).toBeDefined();
    expect(responseJson.data.addedThread).toBeDefined();
    
    expect(responseJson.data.addedThread.id).toBeDefined();
    expect(typeof responseJson.data.addedThread.id).toBe('string');
    expect(responseJson.data.addedThread.id).toMatch(/^thread-/);
    
    expect(responseJson.data.addedThread.title).toEqual(requestPayload.title);
    expect(typeof responseJson.data.addedThread.title).toBe('string');
    
    expect(responseJson.data.addedThread.owner).toEqual('user-123');
    expect(typeof responseJson.data.addedThread.owner).toBe('string');

    const threads = await ThreadsTableTestHelper.findThreadsById(responseJson.data.addedThread.id);
    expect(threads).toHaveLength(1);
    expect(threads[0].id).toEqual(responseJson.data.addedThread.id);
    expect(threads[0].title).toEqual(requestPayload.title);
    expect(threads[0].body).toEqual(requestPayload.body);
    expect(threads[0].owner).toEqual('user-123');
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
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson.message.length).toBeGreaterThan(0);
    
    expect(responseJson.data).toBeUndefined();
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
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson.data).toBeUndefined();
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
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson.data).toBeUndefined();
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
    expect(responseJson.status).toEqual('success');
    expect(responseJson.data).toBeDefined();
    expect(responseJson.data.thread).toBeDefined();

    const thread = responseJson.data.thread;
    expect(thread.id).toEqual(threadId);
    expect(typeof thread.id).toBe('string');
    expect(thread.title).toEqual('Thread untuk test detail');
    expect(typeof thread.title).toBe('string');
    expect(thread.body).toEqual('Body thread untuk test detail');
    expect(typeof thread.body).toBe('string');
    expect(thread.username).toEqual('dicoding');
    expect(typeof thread.username).toBe('string');
    expect(thread.date).toBeDefined();
    expect(typeof thread.date).toBe('string');

    expect(Array.isArray(thread.comments)).toBe(true);
    expect(thread.comments).toHaveLength(2);

    const firstComment = thread.comments[0];
    expect(firstComment.id).toEqual('comment-123');
    expect(typeof firstComment.id).toBe('string');
    expect(firstComment.username).toEqual('dicoding');
    expect(typeof firstComment.username).toBe('string');
    expect(firstComment.content).toEqual('Sebuah komentar');
    expect(typeof firstComment.content).toBe('string');
    expect(firstComment.date).toBeDefined();
    expect(typeof firstComment.date).toBe('string');

    const secondComment = thread.comments[1];
    expect(secondComment.id).toEqual('comment-456');
    expect(secondComment.username).toEqual('dicoding');
    expect(secondComment.content).toEqual('**komentar telah dihapus**');
    expect(typeof secondComment.content).toBe('string');
    expect(secondComment.date).toBeDefined();

    const firstDate = new Date(firstComment.date);
    const secondDate = new Date(secondComment.date);
    expect(firstDate.getTime()).toBeLessThan(secondDate.getTime());
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
    expect(responseJson.status).toEqual('fail');
    expect(responseJson.message).toBeDefined();
    expect(typeof responseJson.message).toBe('string');
    expect(responseJson.message.length).toBeGreaterThan(0);
    expect(responseJson.data).toBeUndefined();
  });

  it('should response 200 and return thread detail without comments', async () => {
    // Arrange
    const server = await createServer(container);

    // Create thread without comments
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
    expect(responseJson.status).toEqual('success');
    
    const thread = responseJson.data.thread;
    expect(thread.id).toEqual(threadId);
    expect(thread.title).toEqual('Thread tanpa komentar');
    expect(thread.body).toEqual('Body thread tanpa komentar');
    expect(thread.username).toEqual('dicoding');
    expect(Array.isArray(thread.comments)).toBe(true);
    expect(thread.comments).toHaveLength(0); 
  });
});
