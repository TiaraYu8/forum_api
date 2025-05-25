const GetThreadDetailByIdUseCase = require('../GetThreadDetailByIdUseCase');
const ThreadDetailService = require('../../../Domains/threads/services/ThreadDetailService');
const GetThread = require('../../../Domains/threads/entities/GetThread');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('GetThreadDetailByIdUseCase', () => {
  it('should orchestrate the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    
    const mockRawDataFromRepository = [
      {
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comment_id: 'comment-123',
        comment_content: 'Sebuah komentar',
        comment_date: '2021-08-08T07:22:33.555Z',
        comment_is_delete: false,
        comment_username: 'johndoe',
      },
    ];

    const expectedThreadDetail = {
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
          content: 'Sebuah komentar',
        },
      ],
    };

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(mockRawDataFromRepository)), 
    };

    const getThreadDetailByIdUseCase = new GetThreadDetailByIdUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailByIdUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
    expect(thread).toStrictEqual(expectedThreadDetail); 
  });

  it('should format deleted comments correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    
    const mockRawDataWithDeletedComment = [
      {
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comment_id: 'comment-123',
        comment_content: 'Komentar asli yang dihapus', 
        comment_date: '2021-08-08T07:22:33.555Z',
        comment_is_delete: true, 
        comment_username: 'johndoe',
      },
    ];

    const expectedThreadWithDeletedComment = {
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
          content: '**komentar telah dihapus**',
        },
      ],
    };

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(mockRawDataWithDeletedComment)),
    };

    const getThreadDetailByIdUseCase = new GetThreadDetailByIdUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailByIdUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
    expect(thread).toStrictEqual(expectedThreadWithDeletedComment);
  });

  it('should handle thread with no comments', async () => {
    // Arrange
    const threadId = 'thread-123';
    
    const mockRawDataNoComments = [
      {
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comment_id: null,
        comment_content: null,
        comment_date: null,
        comment_is_delete: null,
        comment_username: null,
      },
    ];

    const expectedThreadWithoutComments = {
      id: 'thread-123',
      title: 'Thread Title',
      body: 'Thread Body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [], 
    };

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(mockRawDataNoComments)),
    };

    const getThreadDetailByIdUseCase = new GetThreadDetailByIdUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailByIdUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
    expect(thread).toStrictEqual(expectedThreadWithoutComments);
  });

  it('should handle thread with multiple comments in correct order', async () => {
    // Arrange
    const threadId = 'thread-123';
    
    const mockRawDataMultipleComments = [
      {
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comment_id: 'comment-001',
        comment_content: 'Komentar pertama',
        comment_date: '2021-08-08T07:20:00.000Z',
        comment_is_delete: false,
        comment_username: 'user1',
      },
      {
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comment_id: 'comment-002',
        comment_content: 'Komentar kedua yang dihapus',
        comment_date: '2021-08-08T07:25:00.000Z',
        comment_is_delete: true,
        comment_username: 'user2',
      },
    ];

    const expectedThreadWithMultipleComments = {
      id: 'thread-123',
      title: 'Thread Title',
      body: 'Thread Body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-001',
          username: 'user1',
          date: '2021-08-08T07:20:00.000Z',
          content: 'Komentar pertama',
        },
        {
          id: 'comment-002',
          username: 'user2',
          date: '2021-08-08T07:25:00.000Z',
          content: '**komentar telah dihapus**',
        },
      ],
    };

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(mockRawDataMultipleComments)),
    };

    const getThreadDetailByIdUseCase = new GetThreadDetailByIdUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailByIdUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
    expect(thread).toStrictEqual(expectedThreadWithMultipleComments);
    expect(thread.comments).toHaveLength(2);
  });

  it('should throw NotFoundError when thread is not found', async () => {
    // Arrange
    const threadId = 'thread-nonexistent';

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.reject(new NotFoundError('Thread tidak ditemukan'))),
    };

    const getThreadDetailByIdUseCase = new GetThreadDetailByIdUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(getThreadDetailByIdUseCase.execute(threadId))
      .rejects
      .toThrow(NotFoundError);

    expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
  });
});
