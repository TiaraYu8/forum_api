/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123',
    content = 'Sebuah Content',
    thread_id = 'thread-123',
    owner = 'user-123',
    is_delete = false,
    created_at = new Date().toISOString(),
  }) {
    const query = {
      text: 'INSERT INTO comments (id, content, thread_id, owner, is_delete, created_at) VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, content, thread_id, owner, is_delete, created_at],
    };

    await pool.query(query);
  },

  async findCommentById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1 AND is_delete = FALSE',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findCommentByIdIncludingDeleted(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async isCommentSoftDeleted(id) {
    const comments = await this.findCommentByIdIncludingDeleted(id);
    if (comments.length === 0) {
      return false;
    }
    return comments[0].is_delete === true;
  },

  async verifyCommentSoftDeleted(id) {
    const comments = await this.findCommentByIdIncludingDeleted(id);
    return {
      exists: comments.length > 0,
      isSoftDeleted: comments.length > 0 ? comments[0].is_delete : false,
      comment: comments[0] || null
    };
  },

  async findCommentsByThreadId(threadId) {
    const query = {
      text: 'SELECT * FROM comments WHERE thread_id = $1 ORDER BY created_at ASC',
      values: [threadId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

module.exports = CommentsTableTestHelper;
