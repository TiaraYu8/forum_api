const GetThreadDetailUseCase = require('../GetThreadDetailByIdUseCase'); 
const ThreadDetailService = require('../../../Domains/threads/services/ThreadDetailService');
const ThreadNotFoundError = require('../../../Domains/threads/exceptions/ThreadNotFoundError'); 

describe('GetThreadDetailUseCase', () => {
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

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenNthCalledWith(1, threadId);
    
    expect(thread).toEqual(expectedThreadDetail);
    expect(thread).toHaveProperty('id', 'thread-123');
    expect(thread).toHaveProperty('title', 'Thread Title');
    expect(thread).toHaveProperty('body', 'Thread Body');
    expect(thread).toHaveProperty('date', '2021-08-08T07:19:09.775Z');
    expect(thread).toHaveProperty('username', 'dicoding');
    expect(thread).toHaveProperty('comments');
    expect(Array.isArray(thread.comments)).toBe(true);
    expect(thread.comments).toHaveLength(1);
  });

  it('should format deleted comments correctly', async () => {
    // Arrange
    const threadId = 'thread-456';
    
    const mockRawDataWithDeletedComment = [
      {
        id: 'thread-456',
        title: 'Thread With Deleted Comment',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comment_id: 'comment-456',
        comment_content: 'Komentar asli yang dihapus',
        comment_date: '2021-08-08T07:22:33.555Z',
        comment_is_delete: true,
        comment_username: 'johndoe',
      },
    ];

    const expectedThreadWithDeletedComment = {
      id: 'thread-456',
      title: 'Thread With Deleted Comment',
      body: 'Thread Body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-456',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          content: '**komentar telah dihapus**',
        },
      ],
    };

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(mockRawDataWithDeletedComment)),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.getThreadDetailById).toHaveReturnedWith(
      Promise.resolve(mockRawDataWithDeletedComment)
    );
    
    expect(thread).toEqual(expectedThreadWithDeletedComment);
    expect(thread.comments[0].content).toEqual('**komentar telah dihapus**');
    expect(thread.comments[0]).toHaveProperty('id', 'comment-456');
    expect(thread.comments[0]).toHaveProperty('username', 'johndoe');
    expect(thread.comments[0]).toHaveProperty('date', '2021-08-08T07:22:33.555Z');
  });

  it('should handle thread with no comments', async () => {
    // Arrange
    const threadId = 'thread-789';
    
    const mockRawDataNoComments = [
      {
        id: 'thread-789',
        title: 'Thread Without Comments',
        body: 'Thread Body Without Comments',
        date: '2021-08-08T08:00:00.000Z',
        username: 'user123',
        comment_id: null,
        comment_content: null,
        comment_date: null,
        comment_is_delete: null,
        comment_username: null,
      },
    ];

    const expectedThreadWithoutComments = {
      id: 'thread-789',
      title: 'Thread Without Comments',
      body: 'Thread Body Without Comments',
      date: '2021-08-08T08:00:00.000Z',
      username: 'user123',
      comments: [],
    };

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(mockRawDataNoComments)),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith(
      expect.stringMatching(/^thread-/)
    );
    
    expect(thread).toEqual(expectedThreadWithoutComments);
    expect(thread.comments).toEqual([]);
    expect(Array.isArray(thread.comments)).toBe(true);
    expect(thread.comments).toHaveLength(0);
  });

  it('should handle thread with multiple comments in correct order', async () => {
    // Arrange
    const threadId = 'thread-multi';
    
    const mockRawDataMultipleComments = [
      {
        id: 'thread-multi',
        title: 'Thread Multiple Comments',
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
        id: 'thread-multi',
        title: 'Thread Multiple Comments',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comment_id: 'comment-002',
        comment_content: 'Komentar kedua yang dihapus',
        comment_date: '2021-08-08T07:25:00.000Z',
        comment_is_delete: true,
        comment_username: 'user2',
      },
      {
        id: 'thread-multi',
        title: 'Thread Multiple Comments',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comment_id: 'comment-003',
        comment_content: 'Komentar ketiga',
        comment_date: '2021-08-08T07:30:00.000Z',
        comment_is_delete: false,
        comment_username: 'user3',
      },
    ];

    const expectedThreadWithMultipleComments = {
      id: 'thread-multi',
      title: 'Thread Multiple Comments',
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
        {
          id: 'comment-003',
          username: 'user3',
          date: '2021-08-08T07:30:00.000Z',
          content: 'Komentar ketiga',
        },
      ],
    };

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(mockRawDataMultipleComments)),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledTimes(1);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenLastCalledWith(threadId);
    
    expect(thread).toEqual(expectedThreadWithMultipleComments);
    expect(thread.comments).toHaveLength(3);
    expect(thread.comments[0].content).toEqual('Komentar pertama');
    expect(thread.comments[1].content).toEqual('**komentar telah dihapus**');
    expect(thread.comments[2].content).toEqual('Komentar ketiga');
    
    expect(thread.comments[0].date).toEqual('2021-08-08T07:20:00.000Z');
    expect(thread.comments[1].date).toEqual('2021-08-08T07:25:00.000Z');
    expect(thread.comments[2].date).toEqual('2021-08-08T07:30:00.000Z');
  });

  it('should throw ThreadNotFoundError when thread is not found', async () => {
    // Arrange
    const threadId = 'thread-nonexistent';

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.reject(new ThreadNotFoundError('Thread tidak ditemukan'))),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(getThreadDetailUseCase.execute(threadId))
      .rejects
      .toThrow(ThreadNotFoundError);
      
    await expect(getThreadDetailUseCase.execute(threadId))
      .rejects
      .toThrow('Thread tidak ditemukan');

    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledTimes(2); // Called twice due to two expects
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith(threadId);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenNthCalledWith(1, threadId);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenNthCalledWith(2, threadId);
  });

  it('should handle empty thread ID gracefully', async () => {
    // Arrange
    const threadId = '';

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.reject(new ThreadNotFoundError('Thread tidak ditemukan'))),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(getThreadDetailUseCase.execute(threadId))
      .rejects
      .toThrow(ThreadNotFoundError);

    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith('');
  });

  it('should handle null thread ID gracefully', async () => {
    // Arrange
    const threadId = null;

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.reject(new ThreadNotFoundError('Thread tidak ditemukan'))),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action & Assert
    await expect(getThreadDetailUseCase.execute(threadId))
      .rejects
      .toThrow(ThreadNotFoundError);

    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith(null);
  });

  it('should use ThreadDetailService to format raw data correctly', async () => {
    // Arrange
    const threadId = 'thread-service-test';
    
    const mockRawData = [
      {
        id: 'thread-service-test',
        title: 'Service Test Thread',
        body: 'Service Test Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'testuser',
        comment_id: 'comment-service',
        comment_content: 'Service test comment',
        comment_date: '2021-08-08T07:22:33.555Z',
        comment_is_delete: false,
        comment_username: 'commenter',
      },
    ];

    const mockThreadRepository = {
      getThreadDetailById: jest.fn(() => Promise.resolve(mockRawData)),
    };

    const formatSpy = jest.spyOn(ThreadDetailService, 'formatThreadDetail');

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    expect(formatSpy).toHaveBeenCalledTimes(1);
    expect(formatSpy).toHaveBeenCalledWith(mockRawData);
    expect(mockThreadRepository.getThreadDetailById).toHaveBeenCalledWith(threadId);
    
    expect(thread).toHaveProperty('id', 'thread-service-test');
    expect(thread).toHaveProperty('comments');
    expect(thread.comments[0]).toHaveProperty('content', 'Service test comment');

    // Cleanup
    formatSpy.mockRestore();
  });
});
