export function rethrowHttpError(error: unknown): void {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    throw error
  }
}