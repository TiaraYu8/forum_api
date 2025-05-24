class GetThreadDetailByIdUseCase {
    constructor({ threadRepository }) {
      this._threadRepository = threadRepository;
    }
  
    async execute(threadId) {
      const threadDetail = await this._threadRepository.getThreadDetailById(threadId);
      return threadDetail;
    }
  }
  
  module.exports = GetThreadDetailByIdUseCase;
  