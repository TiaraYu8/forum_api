const DeleteCommentUseCase = require('../DeleteCommentUseCase');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

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
        created_at: '2021-08-08T07:19:09.775Z'
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([{
        id: 'comment-123',
        content: 'Some comment content',
        owner: 'user-123', 
        thread_id: 'thread-123',
        is_delete: false,
        created_at: '2021-08-08T07:22:33.555Z'
      }])),
      deleteComment: jest.fn(() => Promise.resolve(1)), 
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    await deleteCommentUseCase.execute(commentId, owner, threadId);

    // Assert
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).toBeCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).toBeCalledWith(commentId);
  });

  it('should throw NotFoundError when thread is not found (NotFoundError instance)', async () => {
    // Arrange
    const commentId = 'comment-123';
    const owner = 'user-123';
    const threadId = 'thread-nonexistent';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.reject(new NotFoundError('Thread tidak ditemukan'))),
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
      .toThrow(NotFoundError);

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).not.toBeCalled();
    expect(mockCommentRepository.deleteComment).not.toBeCalled();
  });

  it('should throw NotFoundError when thread is not found (error name check)', async () => {
    // Arrange
    const commentId = 'comment-123';
    const owner = 'user-123';
    const threadId = 'thread-nonexistent';

    const customError = new Error('Thread with id thread-nonexistent not found in database');
    customError.name = 'NotFoundError';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.reject(customError)),
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
      .toThrow(NotFoundError);

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).not.toBeCalled();
    expect(mockCommentRepository.deleteComment).not.toBeCalled();
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

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).not.toBeCalled();
    expect(mockCommentRepository.deleteComment).not.toBeCalled();
  });

  it('should throw NotFoundError when comment is not found', async () => {
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
        created_at: '2021-08-08T07:19:09.775Z'
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([])), 
      deleteComment: jest.fn(),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow(NotFoundError);

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).toBeCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).not.toBeCalled();
  });

  it('should throw AuthorizationError when user is not the owner', async () => {
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
        created_at: '2021-08-08T07:19:09.775Z'
      })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([{
        id: 'comment-123',
        content: 'Comment from different user',
        owner: commentOwner,
        thread_id: 'thread-123',
        is_delete: false,
        created_at: '2021-08-08T07:22:33.555Z'
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
      .toThrow(AuthorizationError);

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).toBeCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).not.toBeCalled();
  });
});
