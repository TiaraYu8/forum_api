const DeleteCommentUseCase = require('../DeleteCommentUseCase');
// ✅ Import domain errors, bukan HTTP errors
const ThreadNotFoundError = require('../../../Domains/threads/exceptions/ThreadNotFoundError');
const CommentNotFoundError = require('../../../Domains/comments/exceptions/CommentNotFoundError');
const CommentAccessError = require('../../../Domains/comments/exceptions/CommentAccessError');

describe('DeleteCommentUseCase', () => {
  it('should orchestrate the delete comment action correctly', async () => {
    // Arrange
    const commentId = 'comment-123';
    const owner = 'user-123';
    const threadId = 'thread-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: 'thread-123',
        title: 'Some Thread Title',
        body: 'Some thread body',
        owner: 'user-456',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([{
        id: 'comment-123',
        content: 'Some comment content',
        owner: 'user-123', 
        thread_id: 'thread-123',
        is_delete: false,
        created_at: new Date('2021-08-08T07:22:33.555Z'),
      }])),
      deleteComment: jest.fn(() => Promise.resolve(1)), 
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    await deleteCommentUseCase.execute(commentId, owner, threadId);

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledWith(commentId);
    
    expect(mockCommentRepository.deleteComment).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith(commentId);
  });

  it('should throw ThreadNotFoundError when thread is not found', async () => {
    // Arrange
    const commentId = 'comment-123';
    const owner = 'user-123';
    const threadId = 'thread-nonexistent';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.reject(new ThreadNotFoundError('Thread tidak ditemukan'))),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(),
      deleteComment: jest.fn(),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow(ThreadNotFoundError);

    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow('Thread tidak ditemukan');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(2);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).not.toHaveBeenCalled();
    expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
  });

  it('should throw CommentNotFoundError when comment is not found', async () => {
    // Arrange
    const commentId = 'comment-nonexistent';
    const owner = 'user-123';
    const threadId = 'thread-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: 'thread-123',
        title: 'Existing Thread',
        body: 'Thread body content',
        owner: 'user-456',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.reject(new CommentNotFoundError('Komentar tidak ditemukan'))),
      deleteComment: jest.fn(),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow(CommentNotFoundError);

    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow('Komentar tidak ditemukan');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(2);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledTimes(2);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
  });

  it('should throw CommentAccessError when user is not the owner', async () => {
    // Arrange
    const commentId = 'comment-123';
    const requestingUser = 'user-123';
    const commentOwner = 'user-456'; 
    const threadId = 'thread-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: 'thread-123',
        title: 'Some Thread',
        body: 'Thread content',
        owner: 'user-789',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([{
        id: 'comment-123',
        content: 'Comment from different user',
        owner: commentOwner,
        thread_id: 'thread-123',
        is_delete: false,
        created_at: new Date('2021-08-08T07:22:33.555Z'),
      }])),
      deleteComment: jest.fn(),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute(commentId, requestingUser, threadId))
      .rejects
      .toThrow(CommentAccessError);

    await expect(deleteCommentUseCase.execute(commentId, requestingUser, threadId))
      .rejects
      .toThrow('Anda tidak berhak menghapus komentar ini');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(2);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledTimes(2);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
  });

  it('should re-throw other errors from getThreadById', async () => {
    // Arrange
    const commentId = 'comment-123';
    const owner = 'user-123';
    const threadId = 'thread-123';

    const databaseError = new Error('Connection to database failed: timeout after 5000ms');
    databaseError.code = 'ECONNREFUSED';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.reject(databaseError)),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(),
      deleteComment: jest.fn(),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow('Connection to database failed: timeout after 5000ms');

    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow(Error);

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(2);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).not.toHaveBeenCalled();
    expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
  });

  it('should re-throw other errors from findCommentById', async () => {
    // Arrange
    const commentId = 'comment-123';
    const owner = 'user-123';
    const threadId = 'thread-123';

    const databaseError = new Error('Database connection lost');
    databaseError.code = 'CONNECTION_LOST';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: 'thread-123',
        title: 'Some Thread',
        body: 'Thread content',
        owner: 'user-456',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.reject(databaseError)),
      deleteComment: jest.fn(),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow('Database connection lost');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
  });

  it('should handle successful deletion with different user scenarios', async () => {
    // Arrange
    const testCases = [
      {
        commentId: 'comment-001',
        owner: 'user-001',
        threadId: 'thread-001',
        description: 'first user scenario'
      },
      {
        commentId: 'comment-002', 
        owner: 'user-002',
        threadId: 'thread-002',
        description: 'second user scenario'
      }
    ];

    for (const testCase of testCases) {
      const mockThreadRepository = {
        getThreadById: jest.fn(() => Promise.resolve({
          id: testCase.threadId,
          title: `Thread for ${testCase.description}`,
          body: 'Thread body',
          owner: 'thread-owner',
          created_at: new Date('2021-08-08T07:19:09.775Z'),
        })),
      };

      const mockCommentRepository = {
        findCommentById: jest.fn(() => Promise.resolve([{
          id: testCase.commentId,
          content: `Comment for ${testCase.description}`,
          owner: testCase.owner,
          thread_id: testCase.threadId,
          is_delete: false,
          created_at: new Date('2021-08-08T07:22:33.555Z'),
        }])),
        deleteComment: jest.fn(() => Promise.resolve(1)),
      };

      const deleteCommentUseCase = new DeleteCommentUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
      });

      // Action
      await deleteCommentUseCase.execute(testCase.commentId, testCase.owner, testCase.threadId);

      expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
      expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(testCase.threadId);
      expect(mockCommentRepository.findCommentById).toHaveBeenCalledTimes(1);
      expect(mockCommentRepository.findCommentById).toHaveBeenCalledWith(testCase.commentId);
      expect(mockCommentRepository.deleteComment).toHaveBeenCalledTimes(1);
      expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith(testCase.commentId);
    }
  });

  it('should handle edge case with empty comment array', async () => {
    // Arrange
    const commentId = 'comment-123';
    const owner = 'user-123';
    const threadId = 'thread-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        owner: 'user-456',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.reject(new CommentNotFoundError('Komentar tidak ditemukan'))),
      deleteComment: jest.fn(),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow(CommentNotFoundError);

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
  });

  it('should pass correct parameters to repository methods', async () => {
    // Arrange
    const commentId = 'comment-specific-123';
    const owner = 'user-specific-456';
    const threadId = 'thread-specific-789';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: threadId,
        title: 'Specific Thread',
        body: 'Specific Body',
        owner: 'thread-owner-123',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([{
        id: commentId,
        content: 'Specific Comment',
        owner: owner,
        thread_id: threadId,
        is_delete: false,
        created_at: new Date('2021-08-08T07:22:33.555Z'),
      }])),
      deleteComment: jest.fn(() => Promise.resolve(1)),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    await deleteCommentUseCase.execute(commentId, owner, threadId);

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith('thread-specific-789');
    
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.findCommentById).toHaveBeenCalledWith('comment-specific-123');
    
    expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith('comment-specific-123');

    expect(mockThreadRepository.getThreadById).not.toHaveBeenCalledWith(commentId);
    expect(mockCommentRepository.findCommentById).not.toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.deleteComment).not.toHaveBeenCalledWith(threadId);
  });
});
