import { generateImageTask } from './imageGeneration';
import { redisApi } from './redisApi';

jest.mock('./redisApi');

describe('Image Generation Service', () => {
  let taskState: Record<string, any> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    taskState = {};
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('should complete full image generation pipeline', async () => {
    const mockTaskId = 'ba2ee0c1-03c8-4efb-823f-081a6882c178';
    const mockImageUrl = 'https://example.com/generated-image.png';
    
    // Mock Redis operations
    (redisApi.enqueue as jest.Mock).mockImplementation(async (queueName, task) => {
      taskState[mockTaskId] = {
        ...task,
        status: 'pending',
        createdAt: Date.now()
      };
      return mockTaskId;
    });

    (redisApi.getTaskStatus as jest.Mock).mockImplementation(async (taskId) => {
      return taskState[taskId] || { status: 'pending' };
    });

    // Mock fetch for test endpoint
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ taskId: mockTaskId }),
      })
    ) as jest.Mock;

    // Send test generation request
    const response = await fetch('http://localhost:3001/test/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test prompt',
        aspectRatio: '1:1'
      })
    });

    const { taskId } = await response.json();
    expect(taskId).toBe(mockTaskId);

    // Simulate task completion
    jest.advanceTimersByTime(2500);
    taskState[mockTaskId] = {
      ...taskState[mockTaskId],
      status: 'completed',
      result: {
        data: {
          output: {
            image_url: mockImageUrl,
            image_urls: [mockImageUrl]
          }
        }
      }
    };

    // Verify task status and result
    const taskStatus = await redisApi.getTaskStatus(taskId);
    expect(taskStatus.status).toBe('completed');
    expect(taskStatus.result.data.output.image_url).toBe(mockImageUrl);
  });
});