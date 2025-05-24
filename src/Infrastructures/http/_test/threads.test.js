const createServer = require('../createServer');
const pool = require('../../../Infrastructures/database/postgres/pool');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const container = require('../../container');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const BcryptPasswordHash = require ('../../security/BcryptPasswordHash');
const bcrypt = require('bcrypt');

describe('Threads endpoint', () => {
  let accessToken;
  // let passwordHash;

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
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
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
});
