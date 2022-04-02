export interface IDeferred<T> {
  promise: Promise<T>;
  resolve: (res: T) => void;
  reject: (err: unknown) => void;
}

export function defer<T>(): IDeferred<T> {
  const deferred: Partial<IDeferred<T>> = {};
  deferred.promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred as IDeferred<T>;
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
