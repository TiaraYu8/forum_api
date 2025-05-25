const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper'); 
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const GetThread = require('../../../Domains/threads/entities/GetThread'); 
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ThreadRepositoryPostgres', () => {
  beforeEach(async () => {
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

      const owner= 'user-123';

      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(addThread, owner);

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(1);
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: 'Test Thread',
        owner: 'user-123',
      }));
    });

    it('should return added thread correctly', async () => {
      // Arrange
      const addThread = new AddThread({
        title: 'Thread Title',
        body: 'Thread Body',
      });

      const owner= 'user-123';
      const fakeIdGenerator = () => '456';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(addThread, owner);

      // Assert
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-456',
        title: 'Thread Title',
        owner: 'user-123',
      }));
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
    });

    it('should throw NotFoundError when thread not found', async () => { 
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadById('thread-xxx'))
        .rejects.toThrowError(NotFoundError);
    });
  });

  describe('getThreadDetailById function', () => {
    it('should return thread detail with comments correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      
      // Tambah thread
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'Test Thread',
        body: 'Test Body',
        owner: 'user-123',
        created_at: '2021-08-08T07:19:09.775Z',
      });

      // Tambah comment aktif
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Sebuah komentar',
        thread_id: threadId,
        owner: 'user-456',
        is_delete: false,
        created_at: '2021-08-08T07:22:33.555Z',
      });

      // Tambah comment yang dihapus
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
      const threadDetail = await threadRepositoryPostgres.getThreadDetailById(threadId);

      // Assert
      expect(threadDetail).toBeInstanceOf(GetThread);
      expect(threadDetail.id).toEqual(threadId);
      expect(threadDetail.title).toEqual('Test Thread');
      expect(threadDetail.body).toEqual('Test Body');
      expect(threadDetail.username).toEqual('dicoding');
      expect(threadDetail.comments).toHaveLength(2);
      
      // Comment pertama (aktif)
      expect(threadDetail.comments[0].id).toEqual('comment-123');
      expect(threadDetail.comments[0].username).toEqual('johndoe');
      expect(threadDetail.comments[0].content).toEqual('Sebuah komentar');
      
      // Comment kedua (dihapus)
      expect(threadDetail.comments[1].id).toEqual('comment-456');
      expect(threadDetail.comments[1].username).toEqual('dicoding');
      expect(threadDetail.comments[1].content).toEqual('**komentar telah dihapus**');
    });

    it('should return thread detail without comments correctly', async () => {
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
      const threadDetail = await threadRepositoryPostgres.getThreadDetailById(threadId);

      // Assert
      expect(threadDetail).toBeInstanceOf(GetThread);
      expect(threadDetail.id).toEqual(threadId);
      expect(threadDetail.title).toEqual('Thread Tanpa Komentar');
      expect(threadDetail.body).toEqual('Body thread tanpa komentar');
      expect(threadDetail.username).toEqual('dicoding');
      expect(threadDetail.comments).toHaveLength(0);
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

      // Tambah comment dengan urutan waktu berbeda
      await CommentsTableTestHelper.addComment({
        id: 'comment-002',
        content: 'Komentar kedua',
        thread_id: threadId,
        owner: 'user-456',
        is_delete: false,
        created_at: '2021-08-08T07:25:00.000Z', // Lebih baru
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-001',
        content: 'Komentar pertama',
        thread_id: threadId,
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:20:00.000Z', // Lebih lama
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const threadDetail = await threadRepositoryPostgres.getThreadDetailById(threadId);

      // Assert
      expect(threadDetail.comments).toHaveLength(2);
      expect(threadDetail.comments[0].id).toEqual('comment-001'); // Yang lebih lama dulu
      expect(threadDetail.comments[1].id).toEqual('comment-002'); // Yang lebih baru kemudian
    });
  });
});
