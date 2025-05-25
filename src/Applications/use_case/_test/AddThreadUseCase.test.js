const AddThreadUseCase = require('../AddThreadUseCase');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');

describe('AddThreadUseCase', () => {
  it('should orchestrate the add thread action correctly', async () => {
    // Arrange
    const useCasePayload = {
      title: 'Test Thread',
      body: 'Test Body',
    };
    const owner = 'user-123';

    const mockAddedThread = new AddedThread({
      id: 'thread-456', 
      title: 'Mock Thread Title',
      owner: 'mock-owner',
    });

    // Mocking dependencies
    const mockThreadRepository = {
      addThread: jest.fn().mockResolvedValue(mockAddedThread), 
    };

    // Create use case instance
    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload, owner);

    // Assert
    expect(mockThreadRepository.addThread).toBeCalledWith(
      expect.objectContaining({
        title: useCasePayload.title,
        body: useCasePayload.body,
      }), 
      owner,
    );

    const calledAddThread = mockThreadRepository.addThread.mock.calls[0][0];
    expect(calledAddThread).toBeInstanceOf(AddThread);
    expect(calledAddThread.title).toEqual(useCasePayload.title);
    expect(calledAddThread.body).toEqual(useCasePayload.body);
    
    const expectedResult = {
      id: mockAddedThread.id,
      title: mockAddedThread.title,
      owner: mockAddedThread.owner,
    };
    
    expect(addedThread).toStrictEqual(expectedResult);
  });

  it('should handle thread creation with different payload', async () => {
    // Arrange
    const useCasePayload = {
      title: 'Another Thread',
      body: 'Another Body',
    };
    const owner = 'user-456';

    const mockAddedThread = new AddedThread({
      id: 'thread-789',
      title: 'Repository Generated Title',
      owner: 'repository-owner',
    });

    const mockThreadRepository = {
      addThread: jest.fn().mockResolvedValue(mockAddedThread),
    };

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload, owner);

    // Assert
    expect(mockThreadRepository.addThread).toBeCalledWith(
      expect.objectContaining({
        title: 'Another Thread',
        body: 'Another Body',
      }), 
      'user-456',
    );

    expect(addedThread).toStrictEqual({
      id: 'thread-789',
      title: 'Repository Generated Title',
      owner: 'repository-owner',
    });
  });
});
