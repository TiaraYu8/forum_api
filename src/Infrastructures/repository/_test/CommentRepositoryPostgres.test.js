const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
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
        is_delete: false,
      });
  
      // Pastikan komentar sudah ada
      const commentsBeforeDelete = await CommentsTableTestHelper.findCommentById('comment-789');
      expect(commentsBeforeDelete).toHaveLength(1);
      expect(commentsBeforeDelete[0].is_delete).toBe(false);
  
      // Action
      await commentRepositoryPostgres.deleteComment('comment-789');
  
      // Assert
      const allComments = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-789');
      expect(allComments).toHaveLength(1);
      expect(allComments[0].is_delete).toBe(true);
    });
  
    it('should return affected row count when deleting comment', async () => {
      // Arrange
      const fakeIdGenerator = () => '999';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await CommentsTableTestHelper.addComment({
        id: 'comment-999',
        content: 'Komentar untuk test row count',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
      });

      // Action
      const rowCount = await commentRepositoryPostgres.deleteComment('comment-999');

      // Assert
      expect(rowCount).toBe(1); 
    });

    it('should return 0 when comment to delete is not found', async () => {
      // Arrange
      const fakeIdGenerator = () => '000';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);
  
      // Action
      const rowCount = await commentRepositoryPostgres.deleteComment('comment-nonexistent');
  
      // Assert
      expect(rowCount).toBe(0); 
    });

    // it('should throw NotFError when comment to delete is not found', async () => {
    //   // Arrange
    //   const fakeIdGenerator = () => '000';
    //   const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);
  
    //   // Action & Assert
    //   await expect(commentRepositoryPostgres.deleteComment('comment-nonexistent'))
    //     .rejects
    //     .toThrow(NotFoundError);

    //     // expect(rowCount).toBe(0);
    // });
  });
  
});
