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
      title: useCasePayload.title,
      owner: owner,
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

    // Assert - ✅ Verifikasi semua pemanggilan mock
    expect(mockThreadRepository.addThread).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.addThread).toHaveBeenCalledWith(
      expect.objectContaining({
        title: useCasePayload.title,
        body: useCasePayload.body,
      }), 
      owner,
    );

    // ✅ Verifikasi parameter detail
    const calledAddThread = mockThreadRepository.addThread.mock.calls[0][0];
    expect(calledAddThread).toBeInstanceOf(AddThread);
    expect(calledAddThread).toHaveProperty('title', useCasePayload.title);
    expect(calledAddThread).toHaveProperty('body', useCasePayload.body);
    expect(typeof calledAddThread.title).toBe('string');
    expect(typeof calledAddThread.body).toBe('string');

    // ✅ Verifikasi complete AddThread structure
    expect(calledAddThread).toEqual({
      title: useCasePayload.title,
      body: useCasePayload.body,
    });

    // ✅ Verifikasi owner parameter
    const calledOwner = mockThreadRepository.addThread.mock.calls[0][1];
    expect(calledOwner).toEqual(owner);
    expect(typeof calledOwner).toBe('string');
    
    // ✅ Verifikasi return value - tidak menggunakan mock data sebagai expected
    expect(addedThread).toHaveProperty('id');
    expect(typeof addedThread.id).toBe('string');
    expect(addedThread).toHaveProperty('title', useCasePayload.title);
    expect(typeof addedThread.title).toBe('string');
    expect(addedThread).toHaveProperty('owner', owner);
    expect(typeof addedThread.owner).toBe('string');

    // ✅ Verifikasi complete return structure
    expect(addedThread).toEqual({
      id: expect.any(String),
      title: useCasePayload.title,
      owner: owner,
    });
  });

  it('should handle thread creation with different payload', async () => {
    // Arrange
    const useCasePayload = {
      title: 'Another Thread',
      body: 'Another Body',
    };
    const owner = 'user-456';

    // ✅ Mock return value yang konsisten dengan input
    const mockAddedThread = new AddedThread({
      id: 'thread-789',
      title: useCasePayload.title, // ✅ Konsisten dengan input
      owner: owner,
    });

    const mockThreadRepository = {
      addThread: jest.fn().mockResolvedValue(mockAddedThread),
    };

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload, owner);

    expect(mockThreadRepository.addThread).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.addThread).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Another Thread',
        body: 'Another Body',
      }), 
      'user-456',
    );

    const calledAddThread = mockThreadRepository.addThread.mock.calls[0][0];
    expect(calledAddThread).toBeInstanceOf(AddThread);
    expect(calledAddThread.title).toEqual('Another Thread');
    expect(calledAddThread.body).toEqual('Another Body');

    expect(calledAddThread).toEqual({
      title: 'Another Thread',
      body: 'Another Body',
    });

    expect(addedThread).toEqual({
      id: 'thread-789',
      title: 'Another Thread',
      owner: 'user-456',
    });
  });

  it('should handle edge case with minimum valid input', async () => {
    // Arrange
    const useCasePayload = {
      title: 'T',
      body: 'B',
    };
    const owner = 'u';

    const mockAddedThread = new AddedThread({
      id: 'thread-min',
      title: useCasePayload.title,
      owner: owner,
    });

    const mockThreadRepository = {
      addThread: jest.fn().mockResolvedValue(mockAddedThread),
    };

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload, owner);

    expect(mockThreadRepository.addThread).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.addThread).toHaveBeenCalledWith(
      expect.any(AddThread),
      owner,
    );

    const calledAddThread = mockThreadRepository.addThread.mock.calls[0][0];
    expect(calledAddThread.title).toEqual('T');
    expect(calledAddThread.body).toEqual('B');

    expect(addedThread).toEqual({
      id: 'thread-min',
      title: 'T',
      owner: 'u',
    });
  });

  it('should handle thread creation with long content', async () => {
    // Arrange
    const longTitle = 'A'.repeat(100);
    const longBody = 'B'.repeat(1000);
    const useCasePayload = {
      title: longTitle,
      body: longBody,
    };
    const owner = 'user-long';

    const mockAddedThread = new AddedThread({
      id: 'thread-long',
      title: longTitle,
      owner: owner,
    });

    const mockThreadRepository = {
      addThread: jest.fn().mockResolvedValue(mockAddedThread),
    };

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedThread = await addThreadUseCase.execute(useCasePayload, owner);

    expect(mockThreadRepository.addThread).toHaveBeenCalledTimes(1);
    
    const calledAddThread = mockThreadRepository.addThread.mock.calls[0][0];
    expect(calledAddThread.title).toEqual(longTitle);
    expect(calledAddThread.title.length).toEqual(100);
    expect(calledAddThread.body).toEqual(longBody);
    expect(calledAddThread.body.length).toEqual(1000);

    expect(addedThread.title).toEqual(longTitle);
    expect(addedThread.title.length).toEqual(100);
  });

  it('should not call repository when AddThread entity creation fails', async () => {
    // Arrange
    const invalidPayload = {
      title: 123, // Invalid type
      body: 'Valid Body',
    };
    const owner = 'user-123';

    const mockThreadRepository = {
      addThread: jest.fn(),
    };

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addThreadUseCase.execute(invalidPayload, owner))
      .rejects.toThrow();

    expect(mockThreadRepository.addThread).not.toHaveBeenCalled();
    expect(mockThreadRepository.addThread).toHaveBeenCalledTimes(0);
  });

  it('should propagate repository errors correctly', async () => {
    // Arrange
    const useCasePayload = {
      title: 'Test Thread',
      body: 'Test Body',
    };
    const owner = 'user-123';

    const repositoryError = new Error('Database connection failed');
    const mockThreadRepository = {
      addThread: jest.fn().mockRejectedValue(repositoryError),
    };

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(addThreadUseCase.execute(useCasePayload, owner))
      .rejects.toThrow('Database connection failed');

    expect(mockThreadRepository.addThread).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.addThread).toHaveBeenCalledWith(
      expect.any(AddThread),
      owner,
    );
  });
});
