/**
 * Can be used in Array.filter to filter all undefined items out in a way
 * typecsript understands
 *
 * @example
 * ```ts
 * const myArrayWithUndefined = [1, undefined, 2];
 * const myArray: number[] = myArrayWithUndefined.filter(isNotUndefined);
 * // myArray = [1, 2]
 * ```
 */
export const isNotUndefined = <T>(arg: T | undefined): arg is T =>
  arg !== undefined;
