/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.createTable('comments', {
        id: {
          type: 'VARCHAR(50)',
          primaryKey: true,
        },
        content: {
          type: 'TEXT',
          notNull: true,
        },
        thread_id: {
          type: 'varchar(50)',
          notNull: true,
          references:'threads(id)',
          onDelete:'CASCADE',
        },
        owner: {
          type: 'VARCHAR(50)',
          notNull: true,
          references: 'users(id)',
          onDelete: 'CASCADE',
        },
        is_delete: {
          type:'boolean',
          notNull:true,
          default:pgm.func('false'),
        },
        created_at: {
          type: 'TIMESTAMP',
          notNull: true,
          default: pgm.func('CURRENT_TIMESTAMP'),
        },
      });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('comments')
};
