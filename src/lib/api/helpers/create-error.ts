import { ZodError } from "zod";

function createError(message: string, exception?: unknown): { error: string; code?: string; details?: unknown } {
  if (exception instanceof ZodError) {
    return {
      error: message,
      code: "VALIDATION_ERROR",
      details: exception.issues,
    };
  }

  if (exception instanceof Error) {
    return { error: message, details: exception.message };
  }

  return { error: message };
}

export default createError;
