const AuthorizationError = require ('../../Commons/exceptions/AuthorizationError');
const NotFoundError =require('../../Commons/exceptions/NotFoundError');

class DeleteCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(commentId, owner, threadId) {

    console.log('UseCase threadId:', threadId);
    console.log('UseCase commentId:', commentId);
    console.log('UseCase userId:', owner);
    
    try {
      await this._threadRepository.getThreadById(threadId);
    } catch (error) {
      // Jika getThreadById throw NotFoundError, re-throw dengan message yang konsisten
      if (error instanceof NotFoundError || error.name === 'NotFoundError') {
        throw new NotFoundError('Thread tidak ditemukan');
      }
      throw error; // Re-throw error lain
    }

    const comments = await this._commentRepository.findCommentById(commentId);
    if (!comments.length) {
      throw new NotFoundError('Komentar tidak ditemukan');
    }

    if (comments[0].owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak menghapus komentar ini');
    }
    await this._commentRepository.deleteComment(commentId);
  }
}

module.exports = DeleteCommentUseCase;
