const AddComment = require('../../Domains/comments/entities/AddComment');

class AddCommentUseCase {
  constructor({ commentRepository}) {
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload, threadId, owner) {
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
