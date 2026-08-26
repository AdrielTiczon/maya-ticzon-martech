export type ErrorCause = {
  statusCode: number;
  code: string;
  message: string;
};

const httpError = (statusCode: number, code: string, message: string) =>
  new Error(`${code}: ${message}`, {
    cause: { statusCode, code, message } satisfies ErrorCause,
  });

export const badRequest = (c: string, m: string) => httpError(400, c, m);
export const unauthorized = (c: string, m: string) => httpError(401, c, m);
export const notFound = (c: string, m: string) => httpError(404, c, m);
export const unprocessable = (c: string, m: string) => httpError(422, c, m);
export const tooManyRequests = (c: string, m: string) => httpError(429, c, m);
