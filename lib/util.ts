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

export function limitConcurrency<T extends unknown[], U>(
  fn: (...args: T) => Promise<U>,
  concurrency: number,
) {
  const tokens: IDeferred<void>[] = [];
  const processing = new Set();
  async function getToken() {
    const token = defer<void>();
    tokens.push(token);
    check();
    await token.promise;
    return token;
  }
  function releaseToken(token: IDeferred<void>) {
    processing.delete(token);
    check();
  }
  function check() {
    while (tokens.length && processing.size < concurrency) {
      const token = tokens.shift();
      processing.add(token);
      token!.resolve();
    }
  }
  async function limited(...args: T) {
    const token = await getToken();
    try {
      return await fn(...args);
    } finally {
      releaseToken(token);
    }
  }
  return limited;
}
