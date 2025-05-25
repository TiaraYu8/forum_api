const AddThread = require('../AddThread');

describe('AddThread entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      title: 'sebuah thread',
      // body missing
    };

    // Action & Assert
    expect(() => new AddThread(payload)).toThrowError('ADD_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      title: 123, // should be string
      body: true, // should be string
    };

    // Action & Assert
    expect(() => new AddThread(payload)).toThrowError('ADD_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when title contains more than 100 characters', () => {
    // Arrange
    const payload = {
      title: 'a'.repeat(101), // 101 characters
      body: 'isi thread',
    };

    // Action & Assert
    expect(() => new AddThread(payload)).toThrowError('ADD_THREAD.TITLE_LIMIT_CHAR');
  });

  it('should create AddThread object correctly', () => {
    // Arrange
    const payload = {
      title: 'Judul Thread',
      body: 'Isi lengkap thread',
    };

    // Action
    const addThread = new AddThread(payload);

    // Assert
    expect(addThread.title).toEqual(payload.title);
    expect(addThread.body).toEqual(payload.body);
  });

  it('should create AddThread object with exactly 100 characters title', () => {
    // Arrange
    const payload = {
      title: 'a'.repeat(100), // Exactly 100 characters
      body: 'Isi thread',
    };

    // Action
    const addThread = new AddThread(payload);

    // Assert
    expect(addThread.title).toEqual(payload.title);
    expect(addThread.body).toEqual(payload.body);
    expect(addThread.title.length).toEqual(100);
  });
});
