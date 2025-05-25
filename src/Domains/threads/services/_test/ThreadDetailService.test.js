const ThreadDetailService = require('../ThreadDetailService');

describe('ThreadDetailService', () => {
  describe('formatThreadDetail function', () => {
    it('should format thread detail with comments correctly', () => {
      // Arrange
      const rawData = [
        {
          id: 'thread-123',
          title: 'Thread Title',
          body: 'Thread Body',
          date: '2021-08-08T07:19:09.775Z',
          username: 'dicoding',
          comment_id: 'comment-123',
          comment_content: 'Sebuah komentar',
          comment_date: '2021-08-08T07:22:33.555Z',
          comment_is_delete: false,
          comment_username: 'johndoe',
        },
        {
          id: 'thread-123',
          title: 'Thread Title',
          body: 'Thread Body',
          date: '2021-08-08T07:19:09.775Z',
          username: 'dicoding',
          comment_id: 'comment-456',
          comment_content: 'Komentar dihapus',
          comment_date: '2021-08-08T07:26:21.338Z',
          comment_is_delete: true, 
          comment_username: 'dicoding',
        },
      ];

      // Action
      const result = ThreadDetailService.formatThreadDetail(rawData);

      // Assert
      expect(result.id).toEqual('thread-123');
      expect(result.comments).toHaveLength(2);
      expect(result.comments[0].content).toEqual('Sebuah komentar');
      expect(result.comments[1].content).toEqual('**komentar telah dihapus**'); 
    });

    it('should format thread with no comments correctly', () => {
      // Arrange
      const rawData = [
        {
          id: 'thread-123',
          title: 'Thread Title',
          body: 'Thread Body',
          date: '2021-08-08T07:19:09.775Z',
          username: 'dicoding',
          comment_id: null,
          comment_content: null,
          comment_date: null,
          comment_is_delete: null,
          comment_username: null,
        },
      ];

      // Action
      const result = ThreadDetailService.formatThreadDetail(rawData);

      // Assert
      expect(result.comments).toHaveLength(0);
    });

    it('should throw error when data is empty', () => {
      expect(() => ThreadDetailService.formatThreadDetail([]))
        .toThrowError('THREAD_DETAIL_SERVICE.EMPTY_DATA');
    });
  });
});
