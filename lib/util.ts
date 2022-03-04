export interface IDeferred<T> {
  promise: Promise<T>;
  resolve: (res: T) => void;
  reject: (err: any) => void;
}

export function defer<T>(): IDeferred<T> {
  const deferred: Partial<IDeferred<T>> = {};
  deferred.promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred as IDeferred<T>;
}
