const AddComment = require('../../Domains/comments/entities/AddComment');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository}) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, threadId, owner) {

    try {
      await this._threadRepository.getThreadById(threadId);
    } catch (error) {
      // Jika getThreadById throw NotFoundError, re-throw dengan message yang konsisten
      if (error instanceof NotFoundError || error.name === 'NotFoundError') {
        throw new NotFoundError('Thread tidak ditemukan');
      }
      throw error; // Re-throw error lain
    }

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
