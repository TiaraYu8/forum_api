const GetThread = require('../GetThread');

describe('GetThread entity', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const incompletePayload = {
      id: 'thread-123',
      title: 'Thread Title',
      //body is missing
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    // Action & Assert
    expect(() => new GetThread(incompletePayload))
      .toThrowError('GET_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const invalidPayload = {
      id: 123, // Invalid type
      title: 'Thread Title',
      body: 'Thread Body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    // Action & Assert
    expect(() => new GetThread(invalidPayload))
      .toThrowError('GET_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create GetThread object correctly with comments', () => {
    // Arrange
    const inputPayload = {
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
    };

    // Action
    const getThread = new GetThread(inputPayload);

    expect(getThread).toBeInstanceOf(GetThread);
    expect(getThread.id).toEqual('thread-123');
    expect(getThread.title).toEqual('Thread Title');
    expect(getThread.body).toEqual('Thread Body');
    expect(getThread.date).toEqual('2021-08-08T07:19:09.775Z');
    expect(getThread.username).toEqual('dicoding');
    
    expect(getThread.comments).toHaveLength(1);
    expect(getThread.comments[0]).toEqual({
      id: 'comment-123',
      username: 'johndoe',
      date: '2021-08-08T07:22:33.555Z',
      content: 'sebuah comment',
    });
  });

  it('should create GetThread object correctly without comments', () => {
    // Arrange
    const inputPayload = {
      id: 'thread-456',
      title: 'Thread Without Comments',
      body: 'Thread Body Without Comments',
      date: '2021-08-08T08:00:00.000Z',
      username: 'dicoding',
    };

    // Action
    const getThread = new GetThread(inputPayload);

    expect(getThread).toBeInstanceOf(GetThread);
    expect(getThread.id).toEqual('thread-456');
    expect(getThread.title).toEqual('Thread Without Comments');
    expect(getThread.body).toEqual('Thread Body Without Comments');
    expect(getThread.date).toEqual('2021-08-08T08:00:00.000Z');
    expect(getThread.username).toEqual('dicoding');
    expect(getThread.comments).toEqual([]);
    expect(getThread.comments).toHaveLength(0);
  });

  it('should handle multiple comments correctly', () => {
    // Arrange
    const inputPayload = {
      id: 'thread-789',
      title: 'Thread With Multiple Comments',
      body: 'Thread Body',
      date: '2021-08-08T09:00:00.000Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-001',
          username: 'user1',
          date: '2021-08-08T09:10:00.000Z',
          content: 'First comment',
        },
        {
          id: 'comment-002',
          username: 'user2',
          date: '2021-08-08T09:20:00.000Z',
          content: 'Second comment',
        },
      ],
    };

    // Action
    const getThread = new GetThread(inputPayload);

    expect(getThread).toBeInstanceOf(GetThread);
    expect(getThread.comments).toHaveLength(2);
    expect(getThread.comments[0].id).toEqual('comment-001');
    expect(getThread.comments[1].id).toEqual('comment-002');
    expect(getThread.comments[0].content).toEqual('First comment');
    expect(getThread.comments[1].content).toEqual('Second comment');
  });

  it('should throw error when properties are empty strings', () => {
    const inputPayload = {
      id: 'thread-edge',
      title: '', // Empty string should be invalid
      body: 'Valid body',
      date: '2021-08-08T10:00:00.000Z',
      username: 'validuser',
    };

    expect(() => new GetThread(inputPayload))
      .toThrowError('GET_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when username is empty string', () => {
    // Arrange
    const inputPayload = {
      id: 'thread-edge',
      title: 'Valid title',
      body: 'Valid body',
      date: '2021-08-08T10:00:00.000Z',
      username: '', 
    };

    // Action & Assert
    expect(() => new GetThread(inputPayload))
      .toThrowError('GET_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should create GetThread with valid minimum data', () => {
    // Arrange
    const inputPayload = {
      id: 'thread-min',
      title: 'T', 
      body: 'B',  
      date: '2021-08-08T10:00:00.000Z',
      username: 'u',
    };

    // Action
    const getThread = new GetThread(inputPayload);

    // Assert
    expect(getThread).toBeInstanceOf(GetThread);
    expect(getThread.id).toEqual('thread-min');
    expect(getThread.title).toEqual('T');
    expect(getThread.body).toEqual('B');
    expect(getThread.username).toEqual('u');
    expect(getThread.comments).toEqual([]);
  });
});
