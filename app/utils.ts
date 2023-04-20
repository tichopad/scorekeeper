import * as AP from "fp-ts/Apply";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import type { SafeParseReturnType, ZodError, ZodType, ZodTypeDef } from "zod";

/**
 * Runs TaskEithers in a Record in parallel, returning a Record of TaskEithers' results
 */
export const runTasksInParallel = AP.sequenceS(TE.ApplicativePar);

/**
 * Asserts that an expression is truthy, throwing an error if it is not
 */
export function assert(
  expression: any,
  message = "Expected truthy value"
): asserts expression {
  if (!expression) throw new Error(message);
}

/**
 * Converts a FormData object to a plain object
 */
export function convertFormDataToObject(formData: FormData) {
  const object: Record<string, string> = {};
  formData.forEach((value, key) => {
    object[key] = value.toString();
  });
  return object;
}

/**
 * Takes in a ZodSchema.safeParse() return value and returns an Either
 */
export function eitherFromSafeParse<TInput, TOutput>(
  input: SafeParseReturnType<TInput, TOutput>
): E.Either<ZodError<TInput>, TOutput> {
  if (input.success === true) return E.right(input.data);
  else return E.left(input.error);
}

/**
 * Takes in a ZodSchema.safeParse() return value and returns a TaskEither
 */
export function taskEitherFromSafeParse<TInput, TOutput>(
  input: SafeParseReturnType<TInput, TOutput>
): TE.TaskEither<ZodError<TInput>, TOutput> {
  if (input.success === true) return TE.right(input.data);
  else return TE.left(input.error);
}

/**
 * Validate an input against a Zod schema, returning a TaskEither
 */
export const validateWithSchemaAsync =
  <TOutput, TDefinition extends ZodTypeDef, TInput>(
    schema: ZodType<TOutput, TDefinition, TInput>
  ) =>
  (input: unknown) => {
    return pipe(
      TE.tryCatch(
        () => schema.safeParseAsync(input),
        (error) => new Error(`Schema parsing error: ${error}`)
      ),
      TE.chainW(taskEitherFromSafeParse)
    );
  };

/**
 * Validate a FormData object against a Zod schema, returning a TaskEither
 */
export const validateFormDataAsync =
  <TOutput, TDefinition extends ZodTypeDef, TInput>(
    schema: ZodType<TOutput, TDefinition, TInput>
  ) =>
  (formData: FormData) => {
    return pipe(
      formData,
      convertFormDataToObject,
      validateWithSchemaAsync(schema)
    );
  };
