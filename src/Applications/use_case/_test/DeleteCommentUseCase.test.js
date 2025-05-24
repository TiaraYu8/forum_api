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
      getThreadById: jest.fn(() => Promise.resolve({ id: threadId })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([{ id: commentId, owner }])), // ✅ Return array dengan data
      deleteComment: jest.fn(() => Promise.resolve()),
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

  it('should throw NotFoundError when comment is not found', async () => {
    // Arrange
    const commentId = 'comment-123';
    const owner = 'user-123';
    const threadId = 'thread-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({ id: threadId })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([])), // ✅ Return array kosong untuk comment tidak ditemukan
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
    const owner = 'user-123';
    const differentOwner = 'user-456';
    const threadId = 'thread-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({ id: threadId })),
    };

    const mockCommentRepository = {
      findCommentById: jest.fn(() => Promise.resolve([{ id: commentId, owner: differentOwner }])),
      deleteComment: jest.fn(),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action & Assert
    await expect(deleteCommentUseCase.execute(commentId, owner, threadId))
      .rejects
      .toThrow(AuthorizationError);

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.findCommentById).toBeCalledWith(commentId);
    expect(mockCommentRepository.deleteComment).not.toBeCalled();
  });
});
