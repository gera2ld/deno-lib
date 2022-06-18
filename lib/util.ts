export interface IDeferred<T, U = unknown> {
  promise: Promise<T>;
  resolve: (res: T) => void;
  reject: (err: U) => void;
}

export function defer<T, U = unknown>(): IDeferred<T, U> {
  let resolve = (_res: T) => {};
  let reject = (_err: U) => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function memoize<T extends unknown[], U>(
  fn: (...args: T) => U,
  resolver = (...args: T) => `${args[0]}`,
) {
  const cache: { [key: string]: U } = {};
  return (...args: T): U => {
    const key = resolver(...args);
    let result = cache[key];
    if (!result) {
      result = fn(...args);
      cache[key] = result;
    }
    return result;
  };
}
