const AddThreadUseCase = require('../AddThreadUseCase');
const AddThread = require('../../../Domains/threads/entities/AddThread');

describe('AddThreadUseCase', () => {
  it('should orchestrate the add thread action correctly', async () => {
    // Arrange
    const useCasePayload = {
      title: 'Test Thread',
      body: 'Test Body',
    };
    const owner = 'user-123';

    const expectedAddedThread = {
      id: 'thread-123',
      title: useCasePayload.title,
      owner,
    };

    // Mocking dependencies
    const mockThreadRepository = {
      addThread: jest.fn().mockResolvedValue(expectedAddedThread),
    };

    // Create use case instance
    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload, owner);

    // Assert
    expect(mockThreadRepository.addThread).toBeCalledWith(
      expect.any(AddThread), 
      owner,
    );

    const calledAddThread = mockThreadRepository.addThread.mock.calls[0][0];
    expect(calledAddThread.title).toEqual(useCasePayload.title);
    expect(calledAddThread.body).toEqual(useCasePayload.body);
    
    expect(addedThread).toStrictEqual(expectedAddedThread);
  });
});
