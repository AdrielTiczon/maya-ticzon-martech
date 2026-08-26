declare global {
  namespace Express {
    interface Request {
      userId?: string;
      validated?: {
        body?: unknown;
        query?: unknown;
      };
    }
  }
}

export {};
