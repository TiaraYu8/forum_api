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
    pgm.createTable('threads', {
        id: {
          type: 'VARCHAR(50)',
          primaryKey: true,
        },
        title: {
          type: 'TEXT',
          notNull: true,
        },
        body: {
          type: 'TEXT',
          notNull: true,
        },
        owner: {
          type: 'VARCHAR(50)',
          notNull: true,
          references: 'users(id)',
          onDelete: 'CASCADE',
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
    pgm.dropTable('threads');
};
