import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import type { SafeParseReturnType, ZodError, ZodTypeAny } from "zod";

type ZodSchemaValidation<TSchema extends ZodTypeAny> = E.Either<
  ZodError<TSchema["_input"]>,
  TSchema["_output"]
>;

type ZodSchemaValidationTask<
  TSchema extends ZodTypeAny,
  TValidationError = Error
> = TE.TaskEither<
  TValidationError | ZodError<TSchema["_input"]>,
  TSchema["_output"]
>;

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
 * Validate an input against a Zod schema, returning Either
 */
export const validateWithSchema =
  <TSchema extends ZodTypeAny>(schema: TSchema) =>
  (input: unknown): ZodSchemaValidation<TSchema> => {
    return pipe(input, schema.safeParse, eitherFromSafeParse);
  };

/**
 * Validate an input against a Zod schema, returning a TaskEither
 */
export const validateWithSchemaAsync =
  <TSchema extends ZodTypeAny>(schema: TSchema) =>
  (input: unknown): ZodSchemaValidationTask<TSchema> => {
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
  <TSchema extends ZodTypeAny>(schema: TSchema) =>
  (formData: FormData): ZodSchemaValidationTask<TSchema> => {
    return pipe(
      formData,
      (formData) => Object.fromEntries(formData.entries()),
      validateWithSchemaAsync(schema)
    );
  };
