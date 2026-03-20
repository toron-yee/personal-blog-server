import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  requestId: string;
  userId?: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, callback: () => T) {
    return this.storage.run(store, callback);
  }

  enterWith(store: RequestContextStore) {
    this.storage.enterWith(store);
  }

  getStore() {
    return this.storage.getStore();
  }
}
