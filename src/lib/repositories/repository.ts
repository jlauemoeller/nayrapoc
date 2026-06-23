import { ok, err, Result } from "neverthrow";

enum PostgreSQLErrorCode {
  NOT_NULL_VIOLATION = "23502",
  FOREIGN_KEY_VIOLATION = "23503",
  UNIQUE_VIOLATION = "23505"
}

// postgres.js attaches these fields to query errors (see its internal `errorFields` map).
// Note the driver-specific names: `column_name` / `constraint_name` — node-postgres uses
// `column` / `constraint`, so don't reach for `pg`'s `DatabaseError` here.
type PostgresError = {
  code?: string;
  table_name?: string;
  column_name?: string;
  constraint_name?: string;
};

// Drizzle wraps query failures in a generic `"Failed query: …"` error and hangs the real
// postgres.js error (the one carrying `code` / `constraint_name`) off `.cause`. Unwrap one
// level so we inspect the driver error, not Drizzle's envelope.
function toPostgresError(error: unknown): PostgresError | undefined {
  const candidate = error instanceof Error && error.cause ? error.cause : error;
  if (typeof candidate === "object" && candidate !== null && "code" in candidate) {
    return candidate as PostgresError;
  }
  return undefined;
}

// A handler turns one "expected" constraint violation into a typed RecordError; anything
// without a handler stays an exception (an "unexpected" error). `constraint` overrides the
// convention-derived index name (see `findRegisteredHandler`) for the rare cases where
// Drizzle truncated it or the index was created by hand.
type ErrorHandler<T> = {
  field: keyof T & string;
  code: PostgreSQLErrorCode;
  message: string;
  constraint?: string;
};
type HandledErrorsRegistry<T> = ErrorHandler<T>[];

export function unique<T>(
  field: keyof T & string,
  message: string = "has already been taken",
  constraint?: string
): ErrorHandler<T> {
  return { field, code: PostgreSQLErrorCode.UNIQUE_VIOLATION, message, constraint };
}

export function notNull<T>(field: keyof T & string, message: string = "cannot be empty"): ErrorHandler<T> {
  return { field, code: PostgreSQLErrorCode.NOT_NULL_VIOLATION, message };
}

export type RecordError<T> = {
  field: keyof T & string;
  message: string;
};

export async function guarded<T>(
  fn: () => Promise<T>,
  handlers: HandledErrorsRegistry<T> = []
): Promise<Result<T, RecordError<T>>> {
  try {
    return ok(await fn());
  } catch (error) {
    const pgError = toPostgresError(error);
    if (pgError) {
      const handler = findRegisteredHandler(handlers, pgError);
      if (handler) {
        return err({ field: handler.field, message: handler.message });
      }
    }

    throw error;
  }
}

// Match an "expected" handler against the postgres error. The matching key depends on the
// violation: not-null errors carry `column_name`, but unique violations only carry the
// `constraint_name`. For unique we compare against the handler's constraint, defaulting to
// Drizzle's `<table>_<column>_unique` convention — reconstructed from the error's own
// `table_name` so callers don't have to know the actual index name.
function findRegisteredHandler<T>(
  handlers: HandledErrorsRegistry<T>,
  error: PostgresError
): ErrorHandler<T> | undefined {
  return handlers.find((handler) => {
    if (handler.code !== error.code) return false;

    switch (handler.code) {
      case PostgreSQLErrorCode.NOT_NULL_VIOLATION:
        return error.column_name === handler.field;
      case PostgreSQLErrorCode.UNIQUE_VIOLATION:
        return error.constraint_name === (handler.constraint ?? `${error.table_name}_${handler.field}_unique`);
      default:
        return false;
    }
  });
}
