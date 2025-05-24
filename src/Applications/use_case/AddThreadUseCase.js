const AddThread = require('../../Domains/threads/entities/AddThread');

class AddThreadUseCase {
  constructor({ threadRepository}) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, owner) {
    const addThread = new AddThread(useCasePayload);
    const addedThread = await this._threadRepository.addThread(addThread, owner);
  
    return {
      id: addedThread.id,
      title: addedThread.title,
      owner: addedThread.owner,
    };
  }
}

module.exports = AddThreadUseCase;
