class CommentAccessError extends Error {
    constructor(message) {
      super(message);
      this.name = 'CommentAccessError';
    }
  }
  
  module.exports = CommentAccessError;
  