import * as AP from "fp-ts/Apply";
import * as A from "fp-ts/Array";
import * as TE from "fp-ts/TaskEither";

/**
 * Runs TaskEithers in a Record in parallel, returning a Record of TaskEithers' results
 */
export const runTasksInParallel = AP.sequenceS(TE.ApplicativePar);

/**
 * Runs TaskEithers in an Array in parallel, returning a TaskEither resolving to an array of results
 */
export const runTasksArrayInParallel = A.sequence(TE.ApplicativePar);

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
