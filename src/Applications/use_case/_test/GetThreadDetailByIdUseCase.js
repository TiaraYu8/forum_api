const GetThreadDetailByIdUseCase = require('./GetThreadDetailByIdUseCase');

describe('GetThreadDetailByIdUseCase', () => {
  it('should orchestrate the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const mockThreadRepository = {
      getThreadDetailById: jest.fn().mockResolvedValue({
        id: threadId,
        title: 'sebuah thread',
        body: 'isi thread',
        date: '2023-05-23T00:00:00.000Z',
        username: 'dicoding',
      }),
    };

    const getThreadDetailByIdUseCase = new GetThreadDetailByIdUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const threadDetail = await getThreadDetailByIdUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
    expect(threadDetail).toStrictEqual({
      id: threadId,
      title: 'sebuah thread',
      body: 'isi thread',
      date: '2023-05-23T00:00:00.000Z',
      username: 'dicoding',
    });
  });
});
