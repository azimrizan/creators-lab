/** Thrown when Groq is unreachable or keeps failing; routes turn this into a friendly 503. */
export class AIUnavailableError extends Error {
  constructor(message = 'The AI service is busy right now. Please try again in a moment.') {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

/** An error with an HTTP status that routes return as JSON. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
