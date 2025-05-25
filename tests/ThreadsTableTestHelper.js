/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const ThreadsTableTestHelper = {
  async addThread({
  id = 'thread-123', 
  title = 'Test Thread',
  body = 'Test Body', 
  owner = 'user-123',
  created_at = new Date().toISOString(),
}) {
  const query = { 
    text: 'INSERT INTO threads (id, title, body, owner, created_at) VALUES($1, $2, $3, $4, $5)',
    values: [id, title, body, owner, created_at],
  };

  await pool.query(query);
},


  async findThreadsById(id) {
    const query = {
      text: 'SELECT * FROM threads WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findThreadDetailById(id) {
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
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM threads WHERE 1=1');
  },
};

module.exports = ThreadsTableTestHelper;
