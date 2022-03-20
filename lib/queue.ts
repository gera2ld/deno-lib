import { defer, IDeferred } from './util.ts';

export class Queue<T> {
  private data: T[] = [];

  private getQueue = new Set<IDeferred<void>>();
  private putQueue = new Set<IDeferred<void>>();

  constructor(public size = 0) {}

  private defer(queue: Set<IDeferred<void>>, maxWait = 0) {
    const deferred = defer<void>();
    queue.add(deferred);
    deferred.promise.finally(() => {
      queue.delete(deferred);
    });
    if (maxWait) setTimeout(deferred.reject, maxWait);
    return deferred.promise;
  }

  private resolve(queue: Set<IDeferred<void>>) {
    const first = queue.values().next().value as IDeferred<void>;
    if (first) {
      first.resolve();
      queue.delete(first);
    }
  }

  async get(maxWait = 0) {
    if (!this.data.length) await this.defer(this.getQueue, maxWait);
    const result = this.data.shift();
    this.resolve(this.putQueue);
    return result;
  }

  async put(item: T, maxWait = 0) {
    if (this.size && this.data.length >= this.size) await this.defer(this.putQueue, maxWait);
    this.data.push(item);
    this.resolve(this.getQueue);
  }
}
