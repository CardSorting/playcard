export interface Task {
  id: string;
  prompt: string;
  aspectRatio: string;
  processMode: 'relax' | 'fast' | 'turbo';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  updatedAt: number;
  imageUrls?: ImageUrls;
}

export interface ImageUrls {
  main: string;
  variants: string[];
  temporary: string[];
  discord: string;
}

export interface TaskStatusResponse {
  status: string;
  output?: {
    progress?: number;
    image_url?: string;
    image_urls?: string[];
    temporary_image_urls?: string[];
    discord_image_url?: string;
  };
  error?: {
    message: string;
  };
}

export interface TaskCreationParams {
  prompt: string;
  aspectRatio: string;
  processMode: 'relax' | 'fast' | 'turbo';
}

export interface TaskUpdateParams {
  status?: Task['status'];
  progress?: number;
  imageUrls?: ImageUrls;
  error?: string;
}