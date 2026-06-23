import { Result } from "neverthrow";

export type ActionResult<T, E = string> = { success: true; data: T } | { success: false; error: E };

export type FieldError<F extends string = string> = {
  field: F;
  message: string;
};

function isOneOf<F extends PropertyKey>(values: readonly F[], value: PropertyKey): value is F {
  return (values as readonly PropertyKey[]).includes(value);
}

export function actionResult<T, F extends string>(
  result: Result<T, { field: PropertyKey; message: string }>,
  inputFields: readonly F[]
): ActionResult<T, FieldError<F | "root">> {
  if (result.isOk()) {
    return { success: true, data: result.value };
  }

  const { field, message } = result.error;

  return {
    success: false,
    error: isOneOf(inputFields, field) ? { field, message } : { field: "root", message }
  };
}

export function actionErrorResult(message: string): ActionResult<never, FieldError<"root">> {
  return { success: false, error: { field: "root", message: message } };
}

export function notAuthorized() {
  return actionErrorResult("Not authorized");
}

export function invalidInput() {
  return actionErrorResult("Invalid input");
}

export function actionSuccess<T>(data: T): ActionResult<T, never> {
  return { success: true, data: data };
}
