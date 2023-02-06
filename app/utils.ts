export function assert(expression: any, message = 'Expected truthy value'): asserts expression {
  if (!expression) throw new Error(message)
}