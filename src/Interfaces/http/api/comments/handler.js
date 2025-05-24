const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');

class CommentsHandler {
  constructor(container) {
    this._container = container;

    this.postCommentHandler = this.postCommentHandler.bind(this);
    this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
  }

  async postCommentHandler(request, h) {
    const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);

    const { id: owner } = request.auth.credentials;
    const { threadId } = request.params;
    const payload = request.payload;

    const addedComment = await addCommentUseCase.execute(payload, threadId, owner);

    const response = h.response({
      status: 'success',
      data: {
        addedComment,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCommentHandler(request, h) {
    const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);

    const { id: owner } = request.auth.credentials;
    const { threadId, commentId } = request.params;

    console.log('Handler threadId:', threadId); 
    console.log('Handler commentId:', commentId); 
    console.log('Handler owner:', owner); 
    
    await deleteCommentUseCase.execute(commentId, owner, threadId);

    return {
      status: 'success',
      message: 'Komentar berhasil dihapus',
    };
  }
}

module.exports = CommentsHandler;
