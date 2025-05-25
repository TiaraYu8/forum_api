const InvariantError = require('./InvariantError');
const NotFoundError = require('./NotFoundError');
const AuthorizationError = require('./AuthorizationError');

const DomainErrorTranslator = {
  translate(error) {
    const errorMappings = new Map([
      // Domain errors (by error name)
      ['ThreadNotFoundError', (err) => new NotFoundError(err.message)],
      ['CommentNotFoundError', (err) => new NotFoundError(err.message)],
      ['CommentAccessError', (err) => new AuthorizationError(err.message)],
      
      // Validation errors (by error message)
      ['REGISTER_USER.NOT_CONTAIN_NEEDED_PROPERTY', () => new InvariantError('tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada')],
      ['REGISTER_USER.NOT_MEET_DATA_TYPE_SPECIFICATION', () => new InvariantError('tidak dapat membuat user baru karena tipe data tidak sesuai')],
      ['REGISTER_USER.USERNAME_LIMIT_CHAR', () => new InvariantError('tidak dapat membuat user baru karena karakter username melebihi batas limit')],
      ['REGISTER_USER.USERNAME_CONTAIN_RESTRICTED_CHARACTER', () => new InvariantError('tidak dapat membuat user baru karena username mengandung karakter terlarang')],
      ['USER_LOGIN.NOT_CONTAIN_NEEDED_PROPERTY', () => new InvariantError('harus mengirimkan username dan password')],
      ['USER_LOGIN.NOT_MEET_DATA_TYPE_SPECIFICATION', () => new InvariantError('username dan password harus string')],
      ['REFRESH_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN', () => new InvariantError('harus mengirimkan token refresh')],
      ['REFRESH_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION', () => new InvariantError('refresh token harus string')],
      ['DELETE_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN', () => new InvariantError('harus mengirimkan token refresh')],
      ['DELETE_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION', () => new InvariantError('refresh token harus string')],
      ['ADD_THREAD.NOT_CONTAIN_NEEDED_PROPERTY', () => new InvariantError('tidak dapat membuat thread karena properti yang dibutuhkan tidak ada')],
      ['ADD_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION', () => new InvariantError('tidak dapat membuat thread karena tipe data tidak sesuai')],
      ['ADD_THREAD.TITLE_LIMIT_CHAR', () => new InvariantError('tidak dapat membuat thread karena karakter title melebihi batas limit')],
      ['ADD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY', () => new InvariantError('tidak dapat membuat comment karena properti yang dibutuhkan tidak ada')],
      ['ADD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION', () => new InvariantError('tidak dapat membuat comment karena tipe data tidak sesuai')],
    ]);

    const nameMapping = errorMappings.get(error.name);
    if (nameMapping) {
      return nameMapping(error);
    }

    const messageMapping = errorMappings.get(error.message);
    if (messageMapping) {
      return messageMapping(error);
    }

    return error;
  },
};

module.exports = DomainErrorTranslator;
