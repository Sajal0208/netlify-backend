import { CustomError, CustomErrorContent } from "./CustomError";

export default class UnauthorizedError extends CustomError {
  private static readonly _statusCode = 401;
  private readonly _code: number;
  private readonly _logging: boolean;
  private readonly _context: { [key: string]: any };

  constructor(params?: {
    code?: number;
    message?: string;
    logging?: boolean;
    context?: { [key: string]: any };
  }) {
    super(params?.message || "Unauthorized");
    this._code = params?.code || UnauthorizedError._statusCode;
    this._logging = params?.logging || false;
    this._context = params?.context || {};

    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }

  get errors(): CustomErrorContent[] {
    return [{ message: this.message, context: this._context }];
  }

  get statusCode(): number {
    return this._code;
  }

  get logging(): boolean {
    return this._logging;
  }
}
