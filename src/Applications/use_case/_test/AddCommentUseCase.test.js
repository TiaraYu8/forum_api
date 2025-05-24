const AddCommentUseCase = require('../AddCommentUseCase');
const AddComment = require('../../../Domains/comments/entities/AddComment');

describe('AddCommentUseCase', () => {
  it('should orchestrate the add comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'Sebuah Comment',
    };
    const threadId = 'thread-123';
    const owner = 'user-123';

    const expectedAddedComment = {
      id: 'comment-123',
      content: useCasePayload.content,
      owner,
    };

    // Mocking dependencies
    const mockCommentRepository = {
      addComment: jest.fn().mockResolvedValue(expectedAddedComment),
    };

    // Create use case instance
    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(useCasePayload, threadId, owner);

    // Assert
    expect(mockCommentRepository.addComment).toBeCalledWith(
      expect.any(AddComment), 
      threadId,
      owner,
    );

    const calledAddComment = mockCommentRepository.addComment.mock.calls[0][0];
    expect(calledAddComment.content).toEqual(useCasePayload.content);
    
    expect(addedComment).toStrictEqual(expectedAddedComment);
  });
});
