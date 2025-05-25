// src/Domains/comments/exceptions/_test/CommentNotFoundError.test.js
const CommentNotFoundError = require('../CommentNotFoundError');

describe('CommentNotFoundError', () => {
  it('should create CommentNotFoundError correctly', () => {
    // Arrange
    const message = 'Komentar tidak ditemukan';

    // Action
    const error = new CommentNotFoundError(message);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentNotFoundError);
    expect(error.name).toEqual('CommentNotFoundError');
    expect(error.message).toEqual(message);
    expect(typeof error.message).toBe('string');
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });

  it('should create CommentNotFoundError with empty message', () => {
    // Arrange
    const message = '';

    // Action
    const error = new CommentNotFoundError(message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentNotFoundError);
    expect(error.name).toEqual('CommentNotFoundError');
    expect(error.message).toEqual('');
    expect(typeof error.message).toBe('string');
    expect(error.stack).toBeDefined();
  });


  it('should be throwable and catchable', () => {
    // Arrange
    const message = 'Test error message';

    // Action & Assert
    expect(() => {
      throw new CommentNotFoundError(message);
    }).toThrow(CommentNotFoundError);

    expect(() => {
      throw new CommentNotFoundError(message);
    }).toThrow(message);

    expect(() => {
      throw new CommentNotFoundError(message);
    }).toThrow(Error);
  });

  it('should maintain error properties when thrown and caught', () => {
    // Arrange
    const message = 'Komentar tidak ditemukan';
    let caughtError;

    // Action
    try {
      throw new CommentNotFoundError(message);
    } catch (error) {
      caughtError = error;
    }

    // Assert
    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(CommentNotFoundError);
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError.name).toEqual('CommentNotFoundError');
    expect(caughtError.message).toEqual(message);
    expect(caughtError.stack).toBeDefined();
    expect(typeof caughtError.stack).toBe('string');
    expect(caughtError.stack).toContain('CommentNotFoundError');
  });

  it('should have correct prototype chain', () => {
    // Arrange & Action
    const error = new CommentNotFoundError('test');

    // Assert
    expect(error.constructor).toBe(CommentNotFoundError);
    expect(error.constructor.name).toBe('CommentNotFoundError');
    expect(Object.getPrototypeOf(error)).toBe(CommentNotFoundError.prototype);
    expect(Object.getPrototypeOf(CommentNotFoundError.prototype)).toBe(Error.prototype);
  });

  it('should be distinguishable from other error types', () => {
    // Arrange
    const commentError = new CommentNotFoundError('Comment not found');
    const genericError = new Error('Generic error');
    const typeError = new TypeError('Type error');

    // Assert
    expect(commentError instanceof CommentNotFoundError).toBe(true);
    expect(commentError instanceof Error).toBe(true);
    expect(commentError instanceof TypeError).toBe(false);

    expect(genericError instanceof CommentNotFoundError).toBe(false);
    expect(genericError instanceof Error).toBe(true);

    expect(typeError instanceof CommentNotFoundError).toBe(false);
    expect(typeError instanceof Error).toBe(true);
    expect(typeError instanceof TypeError).toBe(true);
  });

  it('should work correctly with error handling patterns', () => {
    // Arrange
    const message = 'Test comment not found';

    // Action & Assert - instanceof check
    try {
      throw new CommentNotFoundError(message);
    } catch (error) {
      if (error instanceof CommentNotFoundError) {
        expect(error.message).toBe(message);
        expect(error.name).toBe('CommentNotFoundError');
      } else {
        fail('Should have caught CommentNotFoundError');
      }
    }

    // Action & Assert - name check
    try {
      throw new CommentNotFoundError(message);
    } catch (error) {
      if (error.name === 'CommentNotFoundError') {
        expect(error.message).toBe(message);
        expect(error).toBeInstanceOf(CommentNotFoundError);
      } else {
        fail('Should have caught CommentNotFoundError by name');
      }
    }
  });

  it('should have consistent behavior across multiple instances', () => {
    // Arrange
    const message1 = 'First comment not found';
    const message2 = 'Second comment not found';

    // Action
    const error1 = new CommentNotFoundError(message1);
    const error2 = new CommentNotFoundError(message2);

    // Assert
    expect(error1.name).toEqual(error2.name);
    expect(error1.constructor).toBe(error2.constructor);
    expect(error1.message).not.toEqual(error2.message);
    expect(error1.stack).not.toEqual(error2.stack);

    expect(error1).toBeInstanceOf(CommentNotFoundError);
    expect(error2).toBeInstanceOf(CommentNotFoundError);
    expect(error1).toBeInstanceOf(Error);
    expect(error2).toBeInstanceOf(Error);
  });

  describe('edge cases', () => {
    it('should handle null message', () => {
      // Action
      const error = new CommentNotFoundError(null);

      // Assert
      expect(error).toBeInstanceOf(CommentNotFoundError);
      expect(error.name).toEqual('CommentNotFoundError');
      expect(error.message).toEqual('null');
    });

    it('should handle numeric message', () => {
      // Action
      const error = new CommentNotFoundError(404);

      // Assert
      expect(error).toBeInstanceOf(CommentNotFoundError);
      expect(error.name).toEqual('CommentNotFoundError');
      expect(error.message).toEqual('404');
    });

    it('should handle object message', () => {
      // Arrange
      const objectMessage = { code: 404, text: 'Not found' };

      // Action
      const error = new CommentNotFoundError(objectMessage);

      // Assert
      expect(error).toBeInstanceOf(CommentNotFoundError);
      expect(error.name).toEqual('CommentNotFoundError');
      expect(error.message).toEqual('[object Object]');
    });

    it('should handle boolean message', () => {
      // Action
      const errorTrue = new CommentNotFoundError(true);
      const errorFalse = new CommentNotFoundError(false);

      // Assert
      expect(errorTrue.message).toEqual('true');
      expect(errorFalse.message).toEqual('false');
      expect(errorTrue.name).toEqual('CommentNotFoundError');
      expect(errorFalse.name).toEqual('CommentNotFoundError');
    });
  });
});
