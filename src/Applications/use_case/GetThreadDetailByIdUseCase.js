const ThreadDetailService = require('../../Domains/threads/services/ThreadDetailService');
const GetThread = require('../../Domains/threads/entities/GetThread');

class GetThreadDetailByIdUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(threadId) {
    const rawThreadData = await this._threadRepository.getThreadDetailById(threadId);
    
    const formattedData = ThreadDetailService.formatThreadDetail(rawThreadData);
    
    const thread = new GetThread(formattedData);
    
    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.date,
      username: thread.username,
      comments: thread.comments,
    };
  }
}

module.exports = GetThreadDetailByIdUseCase;
