import { generateImageTask } from './imageGeneration';
import { redisApi } from './redisApi';

jest.mock('./redisApi');

describe('Image Generation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a task with valid input', async () => {
    const mockTaskId = 'ba2ee0c1-03c8-4efb-823f-081a6882c178';
    (redisApi.enqueue as jest.Mock).mockResolvedValue(mockTaskId);
    (redisApi.get as jest.Mock).mockResolvedValue(null);

    const prompt = 'test prompt';
    const aspectRatio = '1:1';
    
    const taskId = await generateImageTask(prompt, aspectRatio);

    expect(taskId).toBe(mockTaskId);
    expect(redisApi.enqueue).toHaveBeenCalledWith(
      'image_generation_tasks',
      expect.objectContaining({
        prompt,
        aspectRatio,
        timestamp: expect.any(Number)
      })
    );
    expect(redisApi.set).toHaveBeenCalledWith(
      `image_generation_tasks:${prompt}:${aspectRatio}`,
      { task_id: mockTaskId },
      3600
    );
  });

  it('should return existing task ID if task is cached', async () => {
    const mockTaskId = 'ba2ee0c1-03c8-4efb-823f-081a6882c178';
    (redisApi.get as jest.Mock).mockResolvedValue({ task_id: mockTaskId });

    const prompt = 'test prompt';
    const aspectRatio = '1:1';
    
    const taskId = await generateImageTask(prompt, aspectRatio);

    expect(taskId).toBe(mockTaskId);
    expect(redisApi.enqueue).not.toHaveBeenCalled();
  });

  it('should validate task ID format', async () => {
    const mockTaskId = 'ba2ee0c1-03c8-4efb-823f-081a6882c178';
    (redisApi.enqueue as jest.Mock).mockResolvedValue(mockTaskId);
    (redisApi.get as jest.Mock).mockResolvedValue(null);

    const prompt = 'test prompt';
    const aspectRatio = '1:1';
    
    const taskId = await generateImageTask(prompt, aspectRatio);

    // UUID v4 regex pattern
    const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
    expect(taskId).toMatch(uuidPattern);
  });

  it('should handle Redis errors', async () => {
    const errorMessage = 'Redis connection error';
    (redisApi.enqueue as jest.Mock).mockRejectedValue(new Error(errorMessage));
    (redisApi.get as jest.Mock).mockResolvedValue(null);

    const prompt = 'test prompt';
    const aspectRatio = '1:1';
    
    await expect(generateImageTask(prompt, aspectRatio)).rejects.toThrow(errorMessage);
  });
});