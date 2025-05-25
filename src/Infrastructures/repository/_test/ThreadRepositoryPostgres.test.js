const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper'); 
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ThreadRepositoryPostgres', () => {
  beforeEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

    await UsersTableTestHelper.addUser({ 
      id: 'user-123', 
      username: 'dicoding',
      password: 'secret_password',
      fullname: 'Dicoding Indonesia'
    });

    await UsersTableTestHelper.addUser({ 
      id: 'user-456', 
      username: 'johndoe',
      password: 'secret_password',
      fullname: 'John Doe'
    });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist add thread and return added thread correctly', async () => {
      // Arrange
      const addThread = new AddThread({
        title: 'Test Thread',
        body: 'Test Body',
      });
      const owner = 'user-123';
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(addThread, owner);

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(1);
      
      expect(addedThread).toBeInstanceOf(AddedThread);
      expect(addedThread.id).toEqual('thread-123');
      expect(addedThread.title).toEqual('Test Thread');
      expect(addedThread.owner).toEqual('user-123');
      
      expect(threads[0].id).toEqual('thread-123');
      expect(threads[0].title).toEqual('Test Thread');
      expect(threads[0].body).toEqual('Test Body');
      expect(threads[0].owner).toEqual('user-123');
    });

    it('should return added thread correctly with different data', async () => {
      // Arrange
      const addThread = new AddThread({
        title: 'Another Thread Title',
        body: 'Another Thread Body',
      });
      const owner = 'user-456';
      const fakeIdGenerator = () => '456';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(addThread, owner);

      // Assert
      expect(addedThread).toBeInstanceOf(AddedThread);
      expect(addedThread.id).toEqual('thread-456');
      expect(addedThread.title).toEqual('Another Thread Title');
      expect(addedThread.owner).toEqual('user-456');
    });
  });

  describe('getThreadById function', () => {
    it('should return thread detail correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'Test Thread',
        body: 'Test Body',
        owner: 'user-123',
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const thread = await threadRepositoryPostgres.getThreadById(threadId);

      // Assert
      expect(thread.id).toEqual(threadId);
      expect(thread.title).toEqual('Test Thread');
      expect(thread.body).toEqual('Test Body');
      expect(thread.owner).toEqual('user-123');
      expect(thread.created_at).toBeDefined();
    });

    it('should throw NotFoundError when thread not found', async () => { 
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadById('thread-nonexistent'))
        .rejects.toThrowError(NotFoundError);
    });
  });

  describe('getThreadDetailById function', () => {
    it('should return raw thread detail data correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'Test Thread',
        body: 'Test Body',
        owner: 'user-123',
        created_at: '2021-08-08T07:19:09.775Z',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Sebuah komentar',
        thread_id: threadId,
        owner: 'user-456',
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

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const rawData = await threadRepositoryPostgres.getThreadDetailById(threadId);

      // Assert
      expect(Array.isArray(rawData)).toBe(true);
      expect(rawData).toHaveLength(2); 
      
      expect(rawData[0]).toHaveProperty('id', threadId);
      expect(rawData[0]).toHaveProperty('title', 'Test Thread');
      expect(rawData[0]).toHaveProperty('body', 'Test Body');
      expect(rawData[0]).toHaveProperty('username', 'dicoding');
      expect(rawData[0]).toHaveProperty('date');
      
      expect(rawData[0]).toHaveProperty('comment_id', 'comment-123');
      expect(rawData[0]).toHaveProperty('comment_content', 'Sebuah komentar');
      expect(rawData[0]).toHaveProperty('comment_is_delete', false);
      expect(rawData[0]).toHaveProperty('comment_username', 'johndoe');
      expect(rawData[0]).toHaveProperty('comment_date');
      
      expect(rawData[1]).toHaveProperty('comment_id', 'comment-456');
      expect(rawData[1]).toHaveProperty('comment_content', 'Komentar yang dihapus');
      expect(rawData[1]).toHaveProperty('comment_is_delete', true);
      expect(rawData[1]).toHaveProperty('comment_username', 'dicoding');
    });

    it('should return raw data for thread without comments', async () => {
      // Arrange
      const threadId = 'thread-789';
      
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'Thread Tanpa Komentar',
        body: 'Body thread tanpa komentar',
        owner: 'user-123',
        created_at: '2021-08-08T07:19:09.775Z',
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const rawData = await threadRepositoryPostgres.getThreadDetailById(threadId);

      // Assert
      expect(Array.isArray(rawData)).toBe(true);
      expect(rawData).toHaveLength(1);
      expect(rawData[0]).toHaveProperty('id', threadId);
      expect(rawData[0]).toHaveProperty('title', 'Thread Tanpa Komentar');
      expect(rawData[0]).toHaveProperty('comment_id', null);
      expect(rawData[0]).toHaveProperty('comment_content', null);
    });

    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadDetailById('thread-nonexistent'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should order comments by created_at ascending', async () => {
      // Arrange
      const threadId = 'thread-999';
      
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'Thread untuk test urutan',
        body: 'Body thread',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-002',
        content: 'Komentar kedua',
        thread_id: threadId,    
        owner: 'user-456',
        is_delete: false,     
        created_at: '2021-08-08T07:25:00.000Z', // Later timestamp
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-001',
        content: 'Komentar pertama',
        thread_id: threadId,
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:20:00.000Z', // Earlier timestamp
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const rawData = await threadRepositoryPostgres.getThreadDetailById(threadId);

      // Assert
      expect(rawData).toHaveLength(2);
      expect(rawData[0]).toHaveProperty('comment_id', 'comment-001'); // Earlier comment first
      expect(rawData[1]).toHaveProperty('comment_id', 'comment-002'); // Later comment second
      
      const firstCommentDate = new Date(rawData[0].comment_date);
      const secondCommentDate = new Date(rawData[1].comment_date);
      expect(firstCommentDate.getTime()).toBeLessThan(secondCommentDate.getTime());
    });
  });
});
