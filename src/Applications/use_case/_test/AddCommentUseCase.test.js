const AddCommentUseCase = require('../AddCommentUseCase');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const ThreadNotFoundError = require('../../../Domains/threads/exceptions/ThreadNotFoundError');

describe('AddCommentUseCase', () => {
  it('should orchestrate the add comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Sebuah Comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: threadId,
        title: 'Thread Title',
        body: 'Thread Body',
        owner: 'thread-owner',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      addComment: jest.fn(() => Promise.resolve(new AddedComment({
        id: 'comment-456',
        content: useCasePayload.content,
        owner: owner,
      }))),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(useCasePayload, threadId, owner);

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    
    expect(mockCommentRepository.addComment).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.addComment).toHaveBeenCalledWith(
      expect.objectContaining({
        content: useCasePayload.content,
      }),
      threadId,
      owner,
    );

    const calledAddComment = mockCommentRepository.addComment.mock.calls[0][0];
    expect(calledAddComment).toBeInstanceOf(AddComment);
    expect(calledAddComment).toHaveProperty('content', useCasePayload.content);
    expect(calledAddComment).toEqual({
      content: useCasePayload.content,
    });
    
    expect(addedComment).toHaveProperty('id', 'comment-456');
    expect(addedComment).toHaveProperty('content', useCasePayload.content);
    expect(addedComment).toHaveProperty('owner', owner);
    expect(typeof addedComment.id).toBe('string');
    expect(typeof addedComment.content).toBe('string');
    expect(typeof addedComment.owner).toBe('string');

    expect(addedComment).toEqual({
      id: 'comment-456',
      content: useCasePayload.content,
      owner: owner,
    });
  });

  it('should throw ThreadNotFoundError when thread is not found', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Sebuah Comment',
    };
    const threadId = 'thread-nonexistent';
    const owner = 'user-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.reject(new ThreadNotFoundError('Thread tidak ditemukan'))),
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
      .toThrow(ThreadNotFoundError);

    await expect(addCommentUseCase.execute(useCasePayload, threadId, owner))
      .rejects
      .toThrow('Thread tidak ditemukan');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(2);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.addComment).not.toHaveBeenCalled();
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

    await expect(addCommentUseCase.execute(useCasePayload, threadId, owner))
      .rejects
      .toThrow(Error);

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(2);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.addComment).not.toHaveBeenCalled();
  });

  it('should handle AddComment entity validation errors', async () => {
    // Arrange
    const invalidPayload = {
      content: 123,
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: threadId,
        title: 'Thread Title',
        body: 'Thread Body',
        owner: 'thread-owner',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      addComment: jest.fn(),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await expect(addCommentUseCase.execute(invalidPayload, threadId, owner))
      .rejects
      .toThrow('ADD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.addComment).not.toHaveBeenCalled();
  });

  it('should handle missing content property in payload', async () => {
    // Arrange
    const invalidPayload = {
      // Missing content property
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: threadId,
        title: 'Thread Title',
        body: 'Thread Body',
        owner: 'thread-owner',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      addComment: jest.fn(),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await expect(addCommentUseCase.execute(invalidPayload, threadId, owner))
      .rejects
      .toThrow('ADD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.addComment).not.toHaveBeenCalled();
  });

  it('should return correct response format', async () => {
    const useCasePayload = {
      content: 'Test Comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const mockAddedComment = new AddedComment({
      id: 'comment-999',
      content: useCasePayload.content, 
      owner: owner, 
    });

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: threadId,
        title: 'Thread Title',
        body: 'Thread Body',
        owner: 'thread-owner',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      addComment: jest.fn(() => Promise.resolve(mockAddedComment)),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    const result = await addCommentUseCase.execute(useCasePayload, threadId, owner);

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    
    expect(mockCommentRepository.addComment).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.addComment).toHaveBeenCalledWith(
      expect.any(AddComment),
      threadId,
      owner,
    );

    expect(result).toHaveProperty('id', 'comment-999');
    expect(result).toHaveProperty('content', useCasePayload.content);
    expect(result).toHaveProperty('owner', owner);
    expect(typeof result.id).toBe('string');
    expect(typeof result.content).toBe('string');
    expect(typeof result.owner).toBe('string');

    expect(result).toEqual({
      id: 'comment-999',
      content: useCasePayload.content,
      owner: owner,
    });
  });

  it('should handle repository errors correctly', async () => {
    const useCasePayload = {
      content: 'Test Comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const repositoryError = new Error('Repository operation failed');

    const mockThreadRepository = {
      getThreadById: jest.fn(() => Promise.resolve({
        id: threadId,
        title: 'Thread Title',
        body: 'Thread Body',
        owner: 'thread-owner',
        created_at: new Date('2021-08-08T07:19:09.775Z'),
      })),
    };

    const mockCommentRepository = {
      addComment: jest.fn(() => Promise.reject(repositoryError)),
    };

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await expect(addCommentUseCase.execute(useCasePayload, threadId, owner))
      .rejects
      .toThrow('Repository operation failed');

    expect(mockThreadRepository.getThreadById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.addComment).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.addComment).toHaveBeenCalledWith(
      expect.any(AddComment),
      threadId,
      owner,
    );
  });
});
