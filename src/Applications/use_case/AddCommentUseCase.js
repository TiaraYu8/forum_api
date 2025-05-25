const AddComment = require('../../Domains/comments/entities/AddComment');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository}) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, threadId, owner) {

    await this._threadRepository.getThreadById(threadId);

    const addComment = new AddComment(useCasePayload);
    const addedComment = await this._commentRepository.addComment(addComment, threadId, owner);
  
    return {
      id: addedComment.id,
      content: addedComment.content,
      owner: addedComment.owner,
    };
  }
}

module.exports = AddCommentUseCase;
