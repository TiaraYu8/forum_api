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

      expect(result.id).toEqual('thread-123');
      expect(result.title).toEqual('Thread Title');
      expect(result.body).toEqual('Thread Body');
      expect(result.date).toEqual('2021-08-08T07:19:09.775Z');
      expect(result.username).toEqual('dicoding');
      
      expect(result.comments).toHaveLength(2);
      expect(Array.isArray(result.comments)).toBe(true);
      
      expect(result.comments[0]).toEqual({
        id: 'comment-123',
        username: 'johndoe',
        date: '2021-08-08T07:22:33.555Z',
        content: 'Sebuah komentar',
      });
      
      expect(result.comments[1]).toEqual({
        id: 'comment-456',
        username: 'dicoding',
        date: '2021-08-08T07:26:21.338Z',
        content: '**komentar telah dihapus**',
      });
      
      expect(result).toEqual({
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comments: [
          {
            id: 'comment-123',
            username: 'johndoe',
            date: '2021-08-08T07:22:33.555Z',
            content: 'Sebuah komentar',
          },
          {
            id: 'comment-456',
            username: 'dicoding',
            date: '2021-08-08T07:26:21.338Z',
            content: '**komentar telah dihapus**',
          },
        ],
      });
    });

    it('should format thread with no comments correctly', () => {
      // Arrange
      const rawData = [
        {
          id: 'thread-456',
          title: 'Thread Without Comments',
          body: 'Thread Body Without Comments',
          date: '2021-08-08T08:00:00.000Z',
          username: 'user123',
          comment_id: null,
          comment_content: null,
          comment_date: null,
          comment_is_delete: null,
          comment_username: null,
        },
      ];

      // Action
      const result = ThreadDetailService.formatThreadDetail(rawData);

      expect(result.id).toEqual('thread-456');
      expect(result.title).toEqual('Thread Without Comments');
      expect(result.body).toEqual('Thread Body Without Comments');
      expect(result.date).toEqual('2021-08-08T08:00:00.000Z');
      expect(result.username).toEqual('user123');
      
      expect(result.comments).toHaveLength(0);
      expect(Array.isArray(result.comments)).toBe(true);
      expect(result.comments).toEqual([]);
      
      expect(result).toEqual({
        id: 'thread-456',
        title: 'Thread Without Comments',
        body: 'Thread Body Without Comments',
        date: '2021-08-08T08:00:00.000Z',
        username: 'user123',
        comments: [],
      });
    });

    it('should handle multiple comments with different statuses', () => {
      // Arrange
      const rawData = [
        {
          id: 'thread-789',
          title: 'Thread Multiple Comments',
          body: 'Thread Body',
          date: '2021-08-08T09:00:00.000Z',
          username: 'admin',
          comment_id: 'comment-001',
          comment_content: 'First comment',
          comment_date: '2021-08-08T09:10:00.000Z',
          comment_is_delete: false,
          comment_username: 'user1',
        },
        {
          id: 'thread-789',
          title: 'Thread Multiple Comments',
          body: 'Thread Body',
          date: '2021-08-08T09:00:00.000Z',
          username: 'admin',
          comment_id: 'comment-002',
          comment_content: 'Deleted comment',
          comment_date: '2021-08-08T09:15:00.000Z',
          comment_is_delete: true,
          comment_username: 'user2',
        },
        {
          id: 'thread-789',
          title: 'Thread Multiple Comments',
          body: 'Thread Body',
          date: '2021-08-08T09:00:00.000Z',
          username: 'admin',
          comment_id: 'comment-003',
          comment_content: 'Third comment',
          comment_date: '2021-08-08T09:20:00.000Z',
          comment_is_delete: false,
          comment_username: 'user3',
        },
      ];

      // Action
      const result = ThreadDetailService.formatThreadDetail(rawData);

      expect(result.id).toEqual('thread-789');
      expect(result.title).toEqual('Thread Multiple Comments');
      expect(result.body).toEqual('Thread Body');
      expect(result.date).toEqual('2021-08-08T09:00:00.000Z');
      expect(result.username).toEqual('admin');
      
      expect(result.comments).toHaveLength(3);
      expect(Array.isArray(result.comments)).toBe(true);
      
      expect(result.comments[0]).toEqual({
        id: 'comment-001',
        username: 'user1',
        date: '2021-08-08T09:10:00.000Z',
        content: 'First comment',
      });
      
      expect(result.comments[1]).toEqual({
        id: 'comment-002',
        username: 'user2',
        date: '2021-08-08T09:15:00.000Z',
        content: '**komentar telah dihapus**',
      });
      
      expect(result.comments[2]).toEqual({
        id: 'comment-003',
        username: 'user3',
        date: '2021-08-08T09:20:00.000Z',
        content: 'Third comment',
      });
    });

    it('should throw error when data is empty', () => {
      // Action & Assert
      expect(() => ThreadDetailService.formatThreadDetail([]))
        .toThrowError('THREAD_DETAIL_SERVICE.EMPTY_DATA');
    });

    it('should throw error when data is null or undefined', () => {
      // Action & Assert
      expect(() => ThreadDetailService.formatThreadDetail(null))
        .toThrowError('THREAD_DETAIL_SERVICE.EMPTY_DATA');
        
      expect(() => ThreadDetailService.formatThreadDetail(undefined))
        .toThrowError('THREAD_DETAIL_SERVICE.EMPTY_DATA');
    });
  });
});
