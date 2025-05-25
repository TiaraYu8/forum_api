const ThreadNotFoundError = require('../ThreadNotFoundError');

describe('ThreadNotFoundError', () => {
  it('should create error correctly with message', () => {
    const message = 'Thread tidak ditemukan';

    const error = new ThreadNotFoundError(message);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ThreadNotFoundError);
    expect(error.message).toEqual(message);
    expect(error.name).toEqual('ThreadNotFoundError');
    expect(typeof error.message).toBe('string');
    expect(typeof error.name).toBe('string');
    
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
    
    expect(error).toEqual(expect.objectContaining({
      message: message,
      name: 'ThreadNotFoundError',
      stack: expect.any(String),
    }));
  });

  it('should create error correctly with different message', () => {
    const customMessage = 'Thread with ID thread-123 not found';

    const error = new ThreadNotFoundError(customMessage);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ThreadNotFoundError);
    expect(error.message).toEqual(customMessage);
    expect(error.name).toEqual('ThreadNotFoundError');
  });

  it('should create error correctly with empty message', () => {
    const emptyMessage = '';

    const error = new ThreadNotFoundError(emptyMessage);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ThreadNotFoundError);
    expect(error.message).toEqual(emptyMessage);
    expect(error.name).toEqual('ThreadNotFoundError');
  });

  it('should create error correctly with undefined message', () => {
    const error = new ThreadNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ThreadNotFoundError);
    expect(error.message).toEqual('');
    expect(error.name).toEqual('ThreadNotFoundError');
  });

  it('should create error correctly with null message', () => {
    const error = new ThreadNotFoundError(null);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ThreadNotFoundError);
    expect(error.message).toEqual('null');
    expect(error.name).toEqual('ThreadNotFoundError');
  });

  it('should be throwable and catchable', () => {
    const message = 'Thread tidak ditemukan';

    expect(() => {
      throw new ThreadNotFoundError(message);
    }).toThrow(ThreadNotFoundError);

    expect(() => {
      throw new ThreadNotFoundError(message);
    }).toThrow(message);

    expect(() => {
      throw new ThreadNotFoundError(message);
    }).toThrow(Error);
  });

  it('should work correctly in try-catch block', () => {
    const message = 'Thread tidak ditemukan';
    let caughtError;

    try {
      throw new ThreadNotFoundError(message);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(ThreadNotFoundError);
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError.message).toEqual(message);
    expect(caughtError.name).toEqual('ThreadNotFoundError');
  });

  it('should have correct prototype chain', () => {
    const error = new ThreadNotFoundError('test message');

    expect(Object.getPrototypeOf(error)).toBe(ThreadNotFoundError.prototype);
    expect(Object.getPrototypeOf(ThreadNotFoundError.prototype)).toBe(Error.prototype);
    expect(error.constructor).toBe(ThreadNotFoundError);
    expect(error.constructor.name).toBe('ThreadNotFoundError');
  });

  it('should be distinguishable from other error types', () => {
    const threadError = new ThreadNotFoundError('Thread error');
    const genericError = new Error('Generic error');
    const typeError = new TypeError('Type error');

    expect(threadError).toBeInstanceOf(ThreadNotFoundError);
    expect(threadError).not.toBeInstanceOf(TypeError);
    expect(threadError).not.toBeInstanceOf(ReferenceError);

    expect(genericError).not.toBeInstanceOf(ThreadNotFoundError);
    expect(typeError).not.toBeInstanceOf(ThreadNotFoundError);

    expect(threadError.name).toEqual('ThreadNotFoundError');
    expect(genericError.name).toEqual('Error');
    expect(typeError.name).toEqual('TypeError');
  });

  it('should preserve message when converted to string', () => {
    const message = 'Thread tidak ditemukan';
    const error = new ThreadNotFoundError(message);

    const errorString = error.toString();

    expect(errorString).toContain('ThreadNotFoundError');
    expect(errorString).toContain(message);
    expect(errorString).toEqual(`ThreadNotFoundError: ${message}`);
  });

  it('should work correctly with instanceof checks', () => {
    const error = new ThreadNotFoundError('test');

    expect(error instanceof ThreadNotFoundError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof Object).toBe(true);
    expect(error instanceof TypeError).toBe(false);
    expect(error instanceof ReferenceError).toBe(false);
  });

  it('should handle special characters in message', () => {
    const specialMessage = 'Thread "thread-123" tidak ditemukan! @#$%^&*()';

    const error = new ThreadNotFoundError(specialMessage);

    expect(error.message).toEqual(specialMessage);
    expect(error.name).toEqual('ThreadNotFoundError');
    expect(error.toString()).toEqual(`ThreadNotFoundError: ${specialMessage}`);
  });
});
