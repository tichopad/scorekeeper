import * as E from "fp-ts/Either";
import { type SafeParseReturnType } from "zod";

export function assert(
  expression: any,
  message = "Expected truthy value"
): asserts expression {
  if (!expression) throw new Error(message);
}

export const slugify = (...args: (string | number)[]): string => {
  const value = args.join(" ");

  return value
    .normalize("NFD") // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "") // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(/\s+/g, "-"); // separator
};

export function eitherFromSafeParse<Error, Data>(
  input: SafeParseReturnType<Error, Data>
) {
  if (input.success === true) return E.right(input.data);
  else return E.left(input.error);
}
