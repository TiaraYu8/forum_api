const AddCommentUseCase = require('../AddCommentUseCase');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('AddCommentUseCase', () => {
  it('should orchestrate the add comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Sebuah Comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const expectedAddedComment = {
      id: 'comment-123',
      content: useCasePayload.content,
      owner,
    };

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({ id: threadId })),
    };

    const mockCommentRepository = {
      addComment: jest.fn().mockResolvedValue(expectedAddedComment),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(useCasePayload, threadId, owner);

    // Assert
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.addComment).toBeCalledWith(
      expect.any(AddComment), 
      threadId,
      owner,
    );

    const calledAddComment = mockCommentRepository.addComment.mock.calls[0][0];
    expect(calledAddComment.content).toEqual(useCasePayload.content);
    
    expect(addedComment).toStrictEqual({
      id: expectedAddedComment.id,
      content: expectedAddedComment.content,
      owner: expectedAddedComment.owner,
    });
  });

  it('should throw NotFoundError when thread is not found (NotFoundError instance)', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Sebuah Comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.reject(new NotFoundError('Thread tidak ditemukan'))),
    };

    const mockCommentRepository = {
      addComment: jest.fn(),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addCommentUseCase.execute(useCasePayload, threadId, owner))
      .rejects
      .toThrow(NotFoundError);

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.addComment).not.toBeCalled();
  });

  it('should throw NotFoundError when thread is not found (error name check)', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Sebuah Comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const customError = new Error('Custom thread not found');
    customError.name = 'NotFoundError';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.reject(customError)),
    };

    const mockCommentRepository = {
      addComment: jest.fn(),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addCommentUseCase.execute(useCasePayload, threadId, owner))
      .rejects
      .toThrow(NotFoundError);

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.addComment).not.toBeCalled();
  });

  it('should re-throw other errors from getThreadById', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Sebuah Comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const databaseError = new Error('Database connection failed');

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.reject(databaseError)),
    };

    const mockCommentRepository = {
      addComment: jest.fn(),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addCommentUseCase.execute(useCasePayload, threadId, owner))
      .rejects
      .toThrow('Database connection failed');

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.addComment).not.toBeCalled();
  });

  it('should handle AddComment entity validation errors', async () => {
    // Arrange
    const invalidPayload = {
      content: 123, // Seharusnya string
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({ id: threadId })),
    };

    const mockCommentRepository = {
      addComment: jest.fn(),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addCommentUseCase.execute(invalidPayload, threadId, owner))
      .rejects
      .toThrow(); // AddComment entity akan throw error untuk payload tidak valid

    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.addComment).not.toBeCalled();
  });
});
