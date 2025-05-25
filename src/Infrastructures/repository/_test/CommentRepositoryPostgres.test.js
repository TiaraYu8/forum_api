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
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

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
      const owner = 'user-123';
      const threadId = 'thread-123';
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(addComment, threadId, owner);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toEqual('Sebuah Comment');
      expect(comments[0].owner).toEqual('user-123');
      expect(comments[0].thread_id).toEqual('thread-123');

      expect(addedComment).toBeInstanceOf(AddedComment);
      expect(addedComment.id).toEqual('comment-123');
      expect(addedComment.content).toEqual('Sebuah Comment');
      expect(addedComment.owner).toEqual('user-123');
    });

    it('should return added comment correctly without database verification', async () => {
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
      expect(addedComment).toBeInstanceOf(AddedComment);
      expect(addedComment.id).toEqual('comment-456');
      expect(addedComment.content).toEqual('comment content');
      expect(addedComment.owner).toEqual('user-123');
    });
  });

  describe('findCommentById function', () => {
    it('should return comment when comment exists', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Test comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const comments = await commentRepositoryPostgres.findCommentById('comment-123');

      // Assert
      expect(Array.isArray(comments)).toBe(true);
      expect(comments).toHaveLength(1);
      expect(comments[0].id).toEqual('comment-123');
      expect(comments[0].content).toEqual('Test comment');
      expect(comments[0].is_delete).toBe(false);
    });

    it('should return empty array when comment not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const comments = await commentRepositoryPostgres.findCommentById('comment-nonexistent');

      // Assert
      expect(Array.isArray(comments)).toBe(true);
      expect(comments).toHaveLength(0);
    });

    it('should not return soft deleted comments', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-deleted',
        content: 'Deleted comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: true,
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const comments = await commentRepositoryPostgres.findCommentById('comment-deleted');

      // Assert
      expect(comments).toHaveLength(0);
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment and return affected row count', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-789',
        content: 'Komentar untuk dihapus',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const commentsBeforeDelete = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-789');
      expect(commentsBeforeDelete).toHaveLength(1);
      expect(commentsBeforeDelete[0].is_delete).toBe(false);

      // Action
      const rowCount = await commentRepositoryPostgres.deleteComment('comment-789');

      // Assert
      expect(rowCount).toBe(1); // ✅ One row affected

      const commentsAfterDelete = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-789');
      expect(commentsAfterDelete).toHaveLength(1);
      expect(commentsAfterDelete[0].is_delete).toBe(true);

      const activeComments = await CommentsTableTestHelper.findCommentById('comment-789');
      expect(activeComments).toHaveLength(0);
    });

    it('should return 0 when comment to delete is not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const rowCount = await commentRepositoryPostgres.deleteComment('comment-nonexistent');

      // Assert
      expect(rowCount).toBe(0); 
    });

    it('should return 0 when comment is already soft deleted', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-already-deleted',
        content: 'Already deleted comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: true, 
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const rowCount = await commentRepositoryPostgres.deleteComment('comment-already-deleted');

      // Assert
      expect(rowCount).toBe(0);
    });
  });
});
