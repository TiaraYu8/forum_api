const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper'); 
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const ThreadNotFoundError = require('../../../Domains/threads/exceptions/ThreadNotFoundError');

process.env.TZ = 'UTC';

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
      
      expect(threads[0]).toHaveProperty('id', 'thread-123');
      expect(threads[0]).toHaveProperty('title', 'Test Thread');
      expect(threads[0]).toHaveProperty('body', 'Test Body');
      expect(threads[0]).toHaveProperty('owner', 'user-123');
      expect(threads[0]).toHaveProperty('created_at');
      expect(threads[0].created_at).toBeInstanceOf(Date);
      
      expect(threads[0]).toEqual({
        id: 'thread-123',
        title: 'Test Thread',
        body: 'Test Body',
        owner: 'user-123',
        created_at: expect.any(Date),
      });
      
      expect(addedThread).toBeInstanceOf(AddedThread);
      expect(addedThread).toHaveProperty('id', 'thread-123');
      expect(addedThread).toHaveProperty('title', 'Test Thread');
      expect(addedThread).toHaveProperty('owner', 'user-123');
      
      expect(addedThread).toEqual({
        id: 'thread-123',
        title: 'Test Thread',
        owner: 'user-123',
      });
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
      expect(addedThread).toHaveProperty('id', 'thread-456');
      expect(addedThread).toHaveProperty('title', 'Another Thread Title');
      expect(addedThread).toHaveProperty('owner', 'user-456');
      
      expect(addedThread).toEqual({
        id: 'thread-456',
        title: 'Another Thread Title',
        owner: 'user-456',
      });
    });
  });

  describe('getThreadById function', () => {
    it('should return thread detail correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      const testDate = '2021-08-08T07:19:09.775Z';
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'Test Thread',
        body: 'Test Body',
        owner: 'user-123',
        created_at: testDate,
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const thread = await threadRepositoryPostgres.getThreadById(threadId);

      // Assert
      expect(thread).toHaveProperty('id', threadId);
      expect(thread).toHaveProperty('title', 'Test Thread');
      expect(thread).toHaveProperty('body', 'Test Body');
      expect(thread).toHaveProperty('owner', 'user-123');
      expect(thread).toHaveProperty('created_at');
      expect(thread.created_at).toBeDefined();
      
      expect(thread).toEqual({
        id: threadId,
        title: 'Test Thread',
        body: 'Test Body',
        owner: 'user-123',
        created_at: expect.any(Date),
      });
    });

    it('should throw ThreadNotFoundError when thread not found', async () => { 
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadById('thread-nonexistent'))
        .rejects.toThrowError(ThreadNotFoundError);
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

      expect(Array.isArray(rawData)).toBe(true);
      expect(rawData).toHaveLength(2);
      
      expect(rawData[0]).toHaveProperty('id', threadId);
      expect(rawData[0]).toHaveProperty('title', 'Test Thread');
      expect(rawData[0]).toHaveProperty('body', 'Test Body');
      expect(rawData[0]).toHaveProperty('date');
      expect(rawData[0]).toHaveProperty('username', 'dicoding');
      expect(rawData[0]).toHaveProperty('comment_id', 'comment-123');
      expect(rawData[0]).toHaveProperty('comment_content', 'Sebuah komentar');
      expect(rawData[0]).toHaveProperty('comment_date');
      expect(rawData[0]).toHaveProperty('comment_is_delete', false);
      expect(rawData[0]).toHaveProperty('comment_username', 'johndoe');
      
      expect(new Date(rawData[0].date)).toBeInstanceOf(Date);
      expect(new Date(rawData[0].comment_date)).toBeInstanceOf(Date);
      
      expect(rawData[0]).toEqual({
        id: threadId,
        title: 'Test Thread',
        body: 'Test Body',
        date: expect.any(Date),
        username: 'dicoding',
        comment_id: 'comment-123',
        comment_content: 'Sebuah komentar',
        comment_date: expect.any(Date),
        comment_is_delete: false,
        comment_username: 'johndoe',
      });
      
      expect(rawData[1]).toHaveProperty('id', threadId);
      expect(rawData[1]).toHaveProperty('title', 'Test Thread');
      expect(rawData[1]).toHaveProperty('body', 'Test Body');
      expect(rawData[1]).toHaveProperty('date');
      expect(rawData[1]).toHaveProperty('username', 'dicoding');
      expect(rawData[1]).toHaveProperty('comment_id', 'comment-456');
      expect(rawData[1]).toHaveProperty('comment_content', 'Komentar yang dihapus');
      expect(rawData[1]).toHaveProperty('comment_date');
      expect(rawData[1]).toHaveProperty('comment_is_delete', true);
      expect(rawData[1]).toHaveProperty('comment_username', 'dicoding');
      
      expect(rawData[1]).toEqual({
        id: threadId,
        title: 'Test Thread',
        body: 'Test Body',
        date: expect.any(Date),
        username: 'dicoding',
        comment_id: 'comment-456',
        comment_content: 'Komentar yang dihapus',
        comment_date: expect.any(Date),
        comment_is_delete: true,
        comment_username: 'dicoding',
      });
      
      expect(rawData).toEqual([
        {
          id: threadId,
          title: 'Test Thread',
          body: 'Test Body',
          date: expect.any(Date),
          username: 'dicoding',
          comment_id: 'comment-123',
          comment_content: 'Sebuah komentar',
          comment_date: expect.any(Date),
          comment_is_delete: false,
          comment_username: 'johndoe',
        },
        {
          id: threadId,
          title: 'Test Thread',
          body: 'Test Body',
          date: expect.any(Date),
          username: 'dicoding',
          comment_id: 'comment-456',
          comment_content: 'Komentar yang dihapus',
          comment_date: expect.any(Date),
          comment_is_delete: true,
          comment_username: 'dicoding',
        },
      ]);
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

      expect(Array.isArray(rawData)).toBe(true);
      expect(rawData).toHaveLength(1);
      
      expect(rawData[0]).toHaveProperty('id', threadId);
      expect(rawData[0]).toHaveProperty('title', 'Thread Tanpa Komentar');
      expect(rawData[0]).toHaveProperty('body', 'Body thread tanpa komentar');
      expect(rawData[0]).toHaveProperty('date');
      expect(rawData[0]).toHaveProperty('username', 'dicoding');
      expect(rawData[0]).toHaveProperty('comment_id', null);
      expect(rawData[0]).toHaveProperty('comment_content', null);
      expect(rawData[0]).toHaveProperty('comment_date', null);
      expect(rawData[0]).toHaveProperty('comment_is_delete', null);
      expect(rawData[0]).toHaveProperty('comment_username', null);
      
      expect(rawData[0]).toEqual({
        id: threadId,
        title: 'Thread Tanpa Komentar',
        body: 'Body thread tanpa komentar',
        date: expect.any(Date),
        username: 'dicoding',
        comment_id: null,
        comment_content: null,
        comment_date: null,
        comment_is_delete: null,
        comment_username: null,
      });
      
      expect(rawData).toEqual([
        {
          id: threadId,
          title: 'Thread Tanpa Komentar',
          body: 'Body thread tanpa komentar',
          date: expect.any(Date),
          username: 'dicoding',
          comment_id: null,
          comment_content: null,
          comment_date: null,
          comment_is_delete: null,
          comment_username: null,
        },
      ]);
    });

    it('should throw ThreadNotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadDetailById('thread-nonexistent'))
        .rejects.toThrowError(ThreadNotFoundError);
    });

    it('should order comments by created_at ascending', async () => {
      // Arrange
      const threadId = 'thread-999';
      
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'Thread untuk test urutan',
        body: 'Body thread',
        owner: 'user-123',
        created_at: '2021-08-08T07:19:09.775Z',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-002',
        content: 'Komentar kedua',
        thread_id: threadId,    
        owner: 'user-456',
        is_delete: false,     
        created_at: '2021-08-08T07:25:00.000Z',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-001',
        content: 'Komentar pertama',
        thread_id: threadId,
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:20:00.000Z',
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const rawData = await threadRepositoryPostgres.getThreadDetailById(threadId);

      expect(Array.isArray(rawData)).toBe(true);
      expect(rawData).toHaveLength(2);
      
      expect(rawData[0]).toEqual({
        id: threadId,
        title: 'Thread untuk test urutan',
        body: 'Body thread',
        date: expect.any(Date),
        username: 'dicoding',
        comment_id: 'comment-001',
        comment_content: 'Komentar pertama',
        comment_date: expect.any(Date),
        comment_is_delete: false,
        comment_username: 'dicoding',
      });
      
      expect(rawData[1]).toEqual({
        id: threadId,
        title: 'Thread untuk test urutan',
        body: 'Body thread',
        date: expect.any(Date),
        username: 'dicoding',
        comment_id: 'comment-002',
        comment_content: 'Komentar kedua',
        comment_date: expect.any(Date),
        comment_is_delete: false,
        comment_username: 'johndoe',
      });
      
      const firstCommentDate = new Date(rawData[0].comment_date);
      const secondCommentDate = new Date(rawData[1].comment_date);
      expect(firstCommentDate.getTime()).toBeLessThan(secondCommentDate.getTime());
      
      expect(rawData).toEqual([
        {
          id: threadId,
          title: 'Thread untuk test urutan',
          body: 'Body thread',
          date: expect.any(Date),
          username: 'dicoding',
          comment_id: 'comment-001',
          comment_content: 'Komentar pertama',
          comment_date: expect.any(Date),
          comment_is_delete: false,
          comment_username: 'dicoding',
        },
        {
          id: threadId,
          title: 'Thread untuk test urutan',
          body: 'Body thread',
          date: expect.any(Date),
          username: 'dicoding',
          comment_id: 'comment-002',
          comment_content: 'Komentar kedua',
          comment_date: expect.any(Date),
          comment_is_delete: false,
          comment_username: 'johndoe',
        },
      ]);
    });
  });
});
