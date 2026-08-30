export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const unauthenticated = (message = "Sign in first.") => new ApiError(401, message);
export const invalidArgument = (message: string) => new ApiError(400, message);
export const failedPrecondition = (message: string) => new ApiError(409, message);
export const permissionDenied = (message = "You don't have permission to do that.") =>
  new ApiError(403, message);
