const ThreadNotFoundError = require('../../Domains/threads/exceptions/ThreadNotFoundError');
const AddedThread = require('../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(addThread, owner) {
    const { title, body } = addThread;
    const id = `thread-${this._idGenerator()}`;
  
    const query = {
      text: 'INSERT INTO threads (id, title, body, owner) VALUES($1, $2, $3, $4) RETURNING id, title, owner',
      values: [id, title, body, owner],
    };
  
    const result = await this._pool.query(query);
  
    return new AddedThread({ ...result.rows[0] });
  }
  

  async getThreadById(id) {
    const query = {
      text: `
        SELECT id, title, body, owner, created_at FROM threads WHERE id = $1
      `,
      values: [id],
    };

    console.log('Query values:', query.values);
  
    const result = await this._pool.query(query);
  
    if (!result.rowCount) {
      throw new ThreadNotFoundError('thread tidak ditemukan');
    }
  
    return result.rows[0];
  }

  async getThreadDetailById(threadId) {
    try {
      const query = {
        text: `
          SELECT 
            t.id,
            t.title,
            t.body,
            t.created_at as date,
            u.username,
            c.id as comment_id,
            c.content as comment_content,
            c.created_at as comment_date,
            c.is_delete as comment_is_delete,
            cu.username as comment_username
          FROM threads t
          LEFT JOIN users u ON t.owner = u.id
          LEFT JOIN comments c ON t.id = c.thread_id
          LEFT JOIN users cu ON c.owner = cu.id
          WHERE t.id = $1
          ORDER BY c.created_at ASC
        `,
        values: [threadId],
      };

      console.log('Repository query:', query);

      const result = await this._pool.query(query);
      
      console.log('Repository result rowCount:', result.rowCount); 
      console.log('Repository result rows:', result.rows); 

      if (!result.rowCount) {
        throw new ThreadNotFoundError('Thread tidak ditemukan');
      }
      return result.rows;
    } catch (error) {
      console.error('Repository error:', error); 
      throw error;
    }
  }
}  

module.exports = ThreadRepositoryPostgres;
