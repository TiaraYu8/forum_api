class CommentNotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'CommentNotFoundError';
    }
  }
  
  module.exports = CommentNotFoundError;
  