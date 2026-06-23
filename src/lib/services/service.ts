import { RecordError } from "@/lib/repositories/repository";
import { Result, err } from "neverthrow";

export type ServiceError<T> = {
  field: keyof T;
  message: string;
};

type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}` ? `${Head}${Capitalize<SnakeToCamel<Tail>>}` : S;

function camelizeKey<T extends string>(key: T): SnakeToCamel<T> {
  return key.replace(/_(\w)/g, (_, c: string) => c.toUpperCase()) as SnakeToCamel<T>;
}

export function toServiceError<R extends Record<string, unknown>, S>(error: RecordError<R>): ServiceError<S> {
  return {
    field: camelizeKey(error.field) as unknown as keyof S,
    message: error.message
  };
}

export function toServiceErrorResult<R extends Record<string, unknown>, S>(
  error: RecordError<R>
): Result<never, ServiceError<S>> {
  return err(toServiceError(error));
}
