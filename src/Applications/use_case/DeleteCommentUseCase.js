const AuthorizationError = require ('../../Commons/exceptions/AuthorizationError');
const CommentAccessError = require('../../Domains/comments/exceptions/CommentAccessError');
const CommentNotFoundError = require('../../Domains/comments/exceptions/CommentNotFoundError');

class DeleteCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(commentId, owner, threadId) {

    console.log('UseCase threadId:', threadId);
    console.log('UseCase commentId:', commentId);
    console.log('UseCase userId:', owner);

    await this._threadRepository.getThreadById(threadId);

    const comments = await this._commentRepository.findCommentById(commentId);

    if (comments[0].owner !== owner) {
      throw new CommentAccessError('Anda tidak berhak menghapus komentar ini');
    }
    await this._commentRepository.deleteComment(commentId);
  }
}

module.exports = DeleteCommentUseCase;
