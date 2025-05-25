class ThreadDetailService {
    static formatThreadDetail(rawData) {
      if (!rawData || !rawData.length) {
        throw new Error('THREAD_DETAIL_SERVICE.EMPTY_DATA');
      }
  
      const threadData = rawData[0];
      
      const comments = rawData
        .filter(row => row.comment_id)
        .map(row => ({
          id: row.comment_id,
          username: row.comment_username,
          date: row.comment_date,
          content: row.comment_is_delete 
            ? '**komentar telah dihapus**'
            : row.comment_content,
        }));
  
      return {
        id: threadData.id,
        title: threadData.title,
        body: threadData.body,
        date: threadData.date,
        username: threadData.username,
        comments,
      };
    }
  }
  
  module.exports = ThreadDetailService;
  