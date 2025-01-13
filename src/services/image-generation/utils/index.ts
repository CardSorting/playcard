export function validateTaskParams(params: any): boolean {
  return (
    typeof params.prompt === 'string' &&
    typeof params.aspectRatio === 'string' &&
    ['relax', 'fast', 'turbo'].includes(params.processMode)
  );
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}

export function calculateProgress(current: number, total: number): number {
  return Math.round((current / total) * 100);
}