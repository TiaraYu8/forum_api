class ThreadNotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ThreadNotFoundError';
    }
  }
  
  module.exports = ThreadNotFoundError;
  