const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const CommentNotFoundError = require('../../../Domains/comments/exceptions/CommentNotFoundError');

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
      const addComment = new AddComment({
        content: 'Sebuah Comment',
      });
      const owner = 'user-123';
      const threadId = 'thread-123';
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedComment = await commentRepositoryPostgres.addComment(addComment, threadId, owner);

      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      
      expect(comments[0]).toHaveProperty('id', 'comment-123');
      expect(comments[0]).toHaveProperty('content', 'Sebuah Comment');
      expect(comments[0]).toHaveProperty('thread_id', 'thread-123');
      expect(comments[0]).toHaveProperty('owner', 'user-123');
      expect(comments[0]).toHaveProperty('is_delete', false);
      expect(comments[0]).toHaveProperty('created_at');
      expect(comments[0].created_at).toBeInstanceOf(Date);

      expect(comments[0]).toEqual({
        id: 'comment-123',
        content: 'Sebuah Comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: expect.any(Date),
      });

      expect(addedComment).toBeInstanceOf(AddedComment);
      expect(addedComment).toHaveProperty('id', 'comment-123');
      expect(addedComment).toHaveProperty('content', 'Sebuah Comment');
      expect(addedComment).toHaveProperty('owner', 'user-123');
      
      expect(addedComment).toEqual({
        id: 'comment-123',
        content: 'Sebuah Comment',
        owner: 'user-123',
      });
    });

    it('should return added comment correctly without database verification', async () => {
      const addComment = new AddComment({
        content: 'comment content',
      });
      const owner = 'user-123';
      const threadId = 'thread-123';
      const fakeIdGenerator = () => '456';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedComment = await commentRepositoryPostgres.addComment(addComment, threadId, owner);

      expect(addedComment).toBeInstanceOf(AddedComment);
      expect(addedComment).toHaveProperty('id', 'comment-456');
      expect(addedComment).toHaveProperty('content', 'comment content');
      expect(addedComment).toHaveProperty('owner', 'user-123');
      
      expect(addedComment).toEqual({
        id: 'comment-456',
        content: 'comment content',
        owner: 'user-123',
      });
    });
  });

  describe('findCommentById function', () => {
    it('should return comment when comment exists', async () => {
      // Arrange
      const testDate = new Date('2021-08-08T07:22:33.555Z');
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Test comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: testDate.toISOString(),
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.findCommentById('comment-123');

      expect(Array.isArray(comments)).toBe(true);
      expect(comments).toHaveLength(1);
      
      const comment = comments[0];
      expect(comment).toHaveProperty('id', 'comment-123');
      expect(comment).toHaveProperty('content', 'Test comment');
      expect(comment).toHaveProperty('thread_id', 'thread-123');
      expect(comment).toHaveProperty('owner', 'user-123');
      expect(comment).toHaveProperty('is_delete', false);
      expect(comment).toHaveProperty('created_at');
      expect(comment.created_at).toBeInstanceOf(Date);
      
      expect(comment).toEqual({
        id: 'comment-123',
        content: 'Test comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: expect.any(Date),
      });
      
      expect(comments).toEqual([
        {
          id: 'comment-123',
          content: 'Test comment',
          thread_id: 'thread-123',
          owner: 'user-123',
          is_delete: false,
          created_at: expect.any(Date),
        }
      ]);
    });

    it('should return multiple comments when multiple comments exist for different IDs', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-001',
        content: 'First comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:20:00.000Z',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-002',
        content: 'Second comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:25:00.000Z',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.findCommentById('comment-001');

      expect(Array.isArray(comments)).toBe(true);
      expect(comments).toHaveLength(1);
      
      expect(comments[0]).toEqual({
        id: 'comment-001',
        content: 'First comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: expect.any(Date),
      });
    });

    it('should throw CommentNotFoundError when comment not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.findCommentById('comment-nonexistent'))
        .rejects.toThrow(CommentNotFoundError);
        
      await expect(commentRepositoryPostgres.findCommentById('comment-nonexistent'))
        .rejects.toThrow('Komentar tidak ditemukan');
    });

    it('should throw CommentNotFoundError for soft deleted comments', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-deleted',
        content: 'Deleted comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: true,
        created_at: '2021-08-08T07:22:33.555Z',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.findCommentById('comment-deleted'))
        .rejects.toThrow(CommentNotFoundError);
        
      await expect(commentRepositoryPostgres.findCommentById('comment-deleted'))
        .rejects.toThrow('Komentar tidak ditemukan');
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment and return affected row count', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-789',
        content: 'Komentar untuk dihapus',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:22:33.555Z',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const commentsBeforeDelete = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-789');
      expect(commentsBeforeDelete).toHaveLength(1);
      expect(commentsBeforeDelete[0]).toEqual({
        id: 'comment-789',
        content: 'Komentar untuk dihapus',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: expect.any(Date),
      });

      const rowCount = await commentRepositoryPostgres.deleteComment('comment-789');

      expect(rowCount).toBe(1);
      expect(typeof rowCount).toBe('number');

      const commentsAfterDelete = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-789');
      expect(commentsAfterDelete).toHaveLength(1);
      expect(commentsAfterDelete[0]).toEqual({
        id: 'comment-789',
        content: 'Komentar untuk dihapus',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: true,
        created_at: expect.any(Date),
      });

      await expect(commentRepositoryPostgres.findCommentById('comment-789'))
        .rejects.toThrow(CommentNotFoundError);
    });

    it('should throw CommentNotFoundError when comment to delete is not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.deleteComment('comment-nonexistent'))
        .rejects.toThrow(CommentNotFoundError);
        
      await expect(commentRepositoryPostgres.deleteComment('comment-nonexistent'))
        .rejects.toThrow('Komentar tidak ditemukan');
    });

    it('should throw CommentNotFoundError when comment is already soft deleted', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-already-deleted',
        content: 'Already deleted comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: true,
        created_at: '2021-08-08T07:22:33.555Z',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const initialState = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-already-deleted');
      expect(initialState).toHaveLength(1);
      expect(initialState[0].is_delete).toBe(true);

      await expect(commentRepositoryPostgres.deleteComment('comment-already-deleted'))
        .rejects.toThrow(CommentNotFoundError);
        
      await expect(commentRepositoryPostgres.deleteComment('comment-already-deleted'))
        .rejects.toThrow('Komentar tidak ditemukan');

      const finalState = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-already-deleted');
      expect(finalState).toHaveLength(1);
      expect(finalState[0]).toEqual({
        id: 'comment-already-deleted',
        content: 'Already deleted comment',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: true,
        created_at: expect.any(Date),
      });
    });

    it('should handle multiple delete operations correctly', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-multi-1',
        content: 'First comment to delete',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:20:00.000Z',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-multi-2',
        content: 'Second comment to delete',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:25:00.000Z',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const rowCount1 = await commentRepositoryPostgres.deleteComment('comment-multi-1');

      expect(rowCount1).toBe(1);

      const firstCommentAfterDelete = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-multi-1');
      expect(firstCommentAfterDelete[0].is_delete).toBe(true);

      const secondCommentStillActive = await commentRepositoryPostgres.findCommentById('comment-multi-2');
      expect(secondCommentStillActive).toHaveLength(1);
      expect(secondCommentStillActive[0].is_delete).toBe(false);

      const rowCount2 = await commentRepositoryPostgres.deleteComment('comment-multi-2');

      expect(rowCount2).toBe(1);

      await expect(commentRepositoryPostgres.findCommentById('comment-multi-1'))
        .rejects.toThrow(CommentNotFoundError);
      await expect(commentRepositoryPostgres.findCommentById('comment-multi-2'))
        .rejects.toThrow(CommentNotFoundError);

      const allCommentsIncludingDeleted = await CommentsTableTestHelper.findCommentByIdIncludingDeleted('comment-multi-1');
      expect(allCommentsIncludingDeleted).toHaveLength(1);
      expect(allCommentsIncludingDeleted[0].is_delete).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent access correctly', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-concurrent',
        content: 'Comment for concurrent test',
        thread_id: 'thread-123',
        owner: 'user-123',
        is_delete: false,
        created_at: '2021-08-08T07:22:33.555Z',
      });

      const commentRepositoryPostgres1 = new CommentRepositoryPostgres(pool, {});
      const commentRepositoryPostgres2 = new CommentRepositoryPostgres(pool, {});

      // Action
      const findPromise = commentRepositoryPostgres1.findCommentById('comment-concurrent');
      const deletePromise = commentRepositoryPostgres2.deleteComment('comment-concurrent');

      // Assert
      const [comments, rowCount] = await Promise.all([findPromise, deletePromise]);

      expect(Array.isArray(comments)).toBe(true);
      expect(comments).toHaveLength(1);
      expect(rowCount).toBe(1);
    });

    it('should handle empty string comment ID gracefully', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.findCommentById(''))
        .rejects.toThrow(CommentNotFoundError);

      await expect(commentRepositoryPostgres.deleteComment(''))
        .rejects.toThrow(CommentNotFoundError);
    });

    it('should handle null comment ID gracefully', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.findCommentById(null))
        .rejects.toThrow();

      await expect(commentRepositoryPostgres.deleteComment(null))
        .rejects.toThrow();
    });
  });
});
