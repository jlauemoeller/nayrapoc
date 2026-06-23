import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { FieldError } from "@/lib/actions/types";

/**
 * Push a server action's `FieldError` onto a react-hook-form instance.
 *
 * The error's `field` is either a real form field or the synthetic `"root"`. We key on
 * `Path<T>` (RHF's field-path type, a.k.a. `FieldPath<T>`) rather than `keyof T` because
 * that's what `setError` itself accepts — `keyof T` would not be assignable here.
 */
export function applyActionError<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: FieldError<Path<T> | "root">
): void {
  if (error.field === "root") {
    form.setError("root", { type: "custom", message: error.message });
  } else {
    form.setError(error.field, { type: "custom", message: error.message }, { shouldFocus: true });
  }
}
