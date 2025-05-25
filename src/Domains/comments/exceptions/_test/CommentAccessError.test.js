const CommentAccessError = require('../CommentAccessError');

describe('CommentAccessError', () => {
  it('should create CommentAccessError correctly', () => {
    // Arrange
    const message = 'Anda tidak berhak mengakses resource ini';

    // Action
    const error = new CommentAccessError(message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual(message);
    expect(error.name).toEqual('CommentAccessError');
    expect(typeof error.message).toBe('string');
    expect(typeof error.name).toBe('string');
  });

  it('should create CommentAccessError with empty message', () => {
    // Arrange
    const message = '';

    // Action
    const error = new CommentAccessError(message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual('');
    expect(error.name).toEqual('CommentAccessError');
  });

  it('should create CommentAccessError with undefined message', () => {
    // Arrange & Action
    const error = new CommentAccessError();

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual('');
    expect(error.name).toEqual('CommentAccessError');
  });

  it('should create CommentAccessError with null message', () => {
    // Arrange & Action
    const error = new CommentAccessError(null);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual('null');
    expect(error.name).toEqual('CommentAccessError');
  });

  it('should create CommentAccessError with long message', () => {
    // Arrange
    const longMessage = 'A'.repeat(1000);

    // Action
    const error = new CommentAccessError(longMessage);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual(longMessage);
    expect(error.message.length).toEqual(1000);
    expect(error.name).toEqual('CommentAccessError');
  });

  it('should create CommentAccessError with special characters in message', () => {
    // Arrange
    const specialMessage = 'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

    // Action
    const error = new CommentAccessError(specialMessage);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual(specialMessage);
    expect(error.name).toEqual('CommentAccessError');
  });

  it('should create CommentAccessError with multiline message', () => {
    // Arrange
    const multilineMessage = 'Line 1\nLine 2\nLine 3';

    // Action
    const error = new CommentAccessError(multilineMessage);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual(multilineMessage);
    expect(error.message).toContain('\n');
    expect(error.name).toEqual('CommentAccessError');
  });

  it('should have correct error properties structure', () => {
    // Arrange
    const message = 'Test error message';

    // Action
    const error = new CommentAccessError(message);

    expect(error.message).toEqual('Test error message');
    expect(error.name).toEqual('CommentAccessError');
    
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
    expect(error.stack.length).toBeGreaterThan(0);
    
    expect(error).toHaveProperty('message', 'Test error message');
    expect(error).toHaveProperty('name', 'CommentAccessError');
    expect(error).toHaveProperty('stack');
  });

  it('should be throwable and catchable', () => {
    // Arrange
    const message = 'Access denied error';

    // Action & Assert
    expect(() => {
      throw new CommentAccessError(message);
    }).toThrow(CommentAccessError);

    expect(() => {
      throw new CommentAccessError(message);
    }).toThrow(message);

    expect(() => {
      throw new CommentAccessError(message);
    }).toThrow(Error);
  });

  it('should work correctly in try-catch block', () => {
    // Arrange
    const message = 'Caught error message';
    let caughtError;

    // Action
    try {
      throw new CommentAccessError(message);
    } catch (error) {
      caughtError = error;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(CommentAccessError);
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError.message).toEqual(message);
    expect(caughtError.name).toEqual('CommentAccessError');
  });

  it('should be distinguishable from other error types', () => {
    // Arrange
    const message = 'Test message';
    const commentAccessError = new CommentAccessError(message);
    const genericError = new Error(message);
    const typeError = new TypeError(message);

    // Assert
    expect(commentAccessError).toBeInstanceOf(CommentAccessError);
    
    expect(commentAccessError.name).toEqual('CommentAccessError');
    expect(genericError.name).toEqual('Error');
    expect(typeError.name).toEqual('TypeError');
    
    expect(commentAccessError).not.toBe(genericError);
    expect(commentAccessError).not.toBe(typeError);
    
    expect(commentAccessError.constructor).toBe(CommentAccessError);
    expect(genericError.constructor).toBe(Error);
    expect(typeError.constructor).toBe(TypeError);
  });

  it('should maintain error prototype chain', () => {
    // Arrange & Action
    const error = new CommentAccessError('Test message');

    // Assert
    expect(error instanceof CommentAccessError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof Object).toBe(true);
    
    expect(Object.getPrototypeOf(error)).toBe(CommentAccessError.prototype);
    expect(Object.getPrototypeOf(CommentAccessError.prototype)).toBe(Error.prototype);
  });

  it('should handle message type conversion correctly', () => {
    // Arrange & Action
    const numberError = new CommentAccessError(123);
    const booleanError = new CommentAccessError(true);
    const objectError = new CommentAccessError({ key: 'value' });
    const arrayError = new CommentAccessError(['item1', 'item2']);

    // Assert
    expect(numberError.message).toEqual('123');
    expect(booleanError.message).toEqual('true');
    expect(objectError.message).toEqual('[object Object]');
    expect(arrayError.message).toEqual('item1,item2');
    
    expect(numberError.name).toEqual('CommentAccessError');
    expect(booleanError.name).toEqual('CommentAccessError');
    expect(objectError.name).toEqual('CommentAccessError');
    expect(arrayError.name).toEqual('CommentAccessError');
  });

  it('should handle undefined message parameter correctly', () => {
    // Arrange & Action
    const error = new CommentAccessError(undefined);

    // Assert
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual('');
    expect(error.name).toEqual('CommentAccessError');
  });

  it('should serialize correctly to JSON', () => {
    // Arrange
    const message = 'Serialization test';
    const error = new CommentAccessError(message);

    // Action
    const serialized = JSON.stringify(error);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual({
      name: 'CommentAccessError'
    });
    
    const manualSerialized = {
      name: error.name,
      message: error.message,
    };
    
    expect(manualSerialized).toEqual({
      name: 'CommentAccessError',
      message: 'Serialization test',
    });
  });

  it('should handle function as message parameter', () => {
    // Arrange
    const functionMessage = () => 'function message';

    // Action
    const error = new CommentAccessError(functionMessage);

    // Assert
    expect(error).toBeInstanceOf(CommentAccessError);
    expect(error.message).toEqual('() => \'function message\'');
    expect(error.name).toEqual('CommentAccessError');
  });

  it('should compare error instances correctly', () => {
    // Arrange
    const message = 'Same message';
    const error1 = new CommentAccessError(message);
    const error2 = new CommentAccessError(message);

    // Assert
    expect(error1).not.toBe(error2); // Different instances
    expect(error1.message).toEqual(error2.message); // Same message
    expect(error1.name).toEqual(error2.name); // Same name
    expect(error1.constructor).toBe(error2.constructor); // Same constructor
  });

  it('should convert to string correctly', () => {
    // Arrange
    const message = 'String conversion test';
    const error = new CommentAccessError(message);

    // Action & Assert
    expect(error.toString()).toEqual('CommentAccessError: String conversion test');
    expect(String(error)).toEqual('CommentAccessError: String conversion test');
  });

  it('should handle valueOf correctly', () => {
    // Arrange
    const message = 'Value test';
    const error = new CommentAccessError(message);

    // Action & Assert
    expect(error.valueOf()).toBe(error); // valueOf returns the error object itself
    expect(typeof error.valueOf()).toBe('object');
  });
});
