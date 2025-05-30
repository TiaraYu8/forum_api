const AddedComment = require('../../Domains/comments/entities/AddedComment');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const CommentNotFoundError = require('../../Domains/comments/exceptions/CommentNotFoundError');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(addComment, threadId, owner) {
    const { content } = addComment;
    const id = `comment-${this._idGenerator()}`;
  
    const query = {
      text: 'INSERT INTO comments (id, content, thread_id, owner) VALUES($1, $2, $3, $4) RETURNING id, content, owner',
      values: [id, content, threadId, owner],
    };
  
    const result = await this._pool.query(query);
  
    return new AddedComment({ ...result.rows[0] });
  }

  async deleteComment(commentId) {
    const checkQuery = {
      text: 'SELECT id, owner FROM comments WHERE id = $1 AND is_delete = FALSE',
      values: [commentId],
    };

    const checkResult = await this._pool.query(checkQuery);
    
    if (!checkResult.rowCount) {
      throw new CommentNotFoundError('Komentar tidak ditemukan');
    }

    const deleteQuery = {
      text: 'UPDATE comments SET is_delete = TRUE WHERE id = $1 AND is_delete = FALSE',
      values: [commentId],
    };

    const result = await this._pool.query(deleteQuery);
    return result.rowCount;
  }

  async findCommentById(commentId) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1 AND is_delete = FALSE',
      values: [commentId],
    };
  
    console.log('findCommentById query values:', query.values); 
    
    const result = await this._pool.query(query);
    
    console.log('findCommentById result:', result.rows); 
    
    if (!result.rowCount) {
      throw new CommentNotFoundError('Komentar tidak ditemukan');
    }

    return result.rows;
  }
  
  
}  

module.exports = CommentRepositoryPostgres;
