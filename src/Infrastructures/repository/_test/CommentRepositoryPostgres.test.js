const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
// const InvariantError = require('../../../Commons/exceptions/InvariantError');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('CommentRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ 
      id: 'user-123', 
      username: 'dicoding',
      password: 'secret_password',
      fullname: 'Dicoding Indonesia'
    });

    await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Test Thread',
        body: 'Test thread body',
        owner: 'user-123'
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

  describe('addComment function', () => {
    it('should persist add comment and return added comment correctly', async () => {
      // Arrange
      const addComment = new AddComment({
        content: 'Sebuah Comment',
      });

      const owner= 'user-123';
      const threadId = 'thread-123';

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(addComment, threadId, owner);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'Sebuah Comment',
        owner: 'user-123',
      }));
    });

    it('should return added comment correctly', async () => {
      // Arrange
      const addComment = new AddComment({
        content: 'comment content',
      });

      const owner = 'user-123';
      const threadId = 'thread-123';
      const fakeIdGenerator = () => '456';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(addComment, threadId, owner);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-456',
        content: 'comment content',
        owner: 'user-123',
      }));
    });
  });

  describe('deleteComment function', () => {
    it('should delete comment correctly', async () => {
      // Arrange
      const owner = 'user-123';
      const threadId = 'thread-123';
      const fakeIdGenerator = () => '789';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);
  
      // Menambahkan komentar terlebih dahulu ke database
      await CommentsTableTestHelper.addComment({
        id: 'comment-789',
        content: 'Komentar untuk dihapus',
        thread_id: threadId,
        owner,
      });
  
      // Pastikan komentar sudah ada
      const commentsBeforeDelete = await CommentsTableTestHelper.findCommentById('comment-789');
      expect(commentsBeforeDelete).toHaveLength(1);
  
      // Action
      await commentRepositoryPostgres.deleteComment('comment-789');
  
      // Assert
      const commentsAfterDelete = await CommentsTableTestHelper.findCommentById('comment-789');
      expect(commentsAfterDelete).toHaveLength(0);
    });
  
    it('should throw InvariantError when comment to delete is not found', async () => {
      // Arrange
      const fakeIdGenerator = () => '000';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);
  
      // Action & Assert
      await expect(commentRepositoryPostgres.deleteComment('comment-nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
});
