const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AddedThread = require('../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const GetThread = require('../../Domains/threads/entities/GetThread');

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
        SELECT threads.id, threads.title, threads.body, threads.created_at as date, threads.owner
        FROM threads
        WHERE threads.id = $1
      `,
      values: [id],
    };

    console.log('Query values:', query.values);
  
    const result = await this._pool.query(query);
  
    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
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
        throw new NotFoundError('Thread tidak ditemukan');
      }

      // Process hasil query
      const threadData = result.rows[0];
      const comments = result.rows
        .filter(row => row.comment_id)
        .map(row => ({
          id: row.comment_id,
          username: row.comment_username,
          date: row.comment_date,
          content: row.comment_is_delete ? '**komentar telah dihapus**' : row.comment_content,
        }));

      console.log('Processed comments:', comments);

      const getThread = new GetThread({
        id: threadData.id,
        title: threadData.title,
        body: threadData.body,
        date: threadData.date,
        username: threadData.username,
        comments,
      });

      console.log('Created GetThread:', getThread);

      return getThread;
    } catch (error) {
      console.error('Repository error:', error); 
      throw error;
    }
  }
}  

module.exports = ThreadRepositoryPostgres;
