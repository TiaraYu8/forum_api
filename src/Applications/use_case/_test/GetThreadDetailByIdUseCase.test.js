const GetThreadDetailUseCase = require('../GetThreadDetailByIdUseCase');
const GetThread = require('../../../Domains/threads/entities/GetThread');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrate the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const expectedThread = new GetThread({
      id: 'thread-123',
      title: 'Thread Title',
      body: 'Thread Body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: 'sebuah comment',
        },
      ],
    });

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(expectedThread)),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
    expect(thread).toStrictEqual({
      id: expectedThread.id,
      title: expectedThread.title,
      body: expectedThread.body,
      date: expectedThread.date,
      username: expectedThread.username,
      comments: expectedThread.comments,
    });
  });

  it('should throw NotFoundError when thread is not found', async () => {
    // Arrange
    const threadId = 'thread-123';

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.reject(new NotFoundError('Thread tidak ditemukan'))),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(getThreadDetailUseCase.execute(threadId))
      .rejects
      .toThrow(NotFoundError);

    expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
  });
});
