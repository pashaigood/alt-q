// storeListener.ts
import { EventEmitter } from 'events';
import { Store } from '@reduxjs/toolkit';
import store from '../store';

type State = ReturnType<typeof store.getState>;

export class StoreListener {
  private store: Store;
  private eventEmitter: EventEmitter;

  constructor(store: Store) {
    this.store = store;
    this.eventEmitter = new EventEmitter();
    this.subscribe();
  }

  private subscribe(): void {
    let prevState = this.store.getState();

    this.store.subscribe(() => {
      const currentState = this.store.getState();
      if (prevState !== currentState) {
        this.eventEmitter.emit('storeChanged', currentState);
      }
      prevState = currentState;
    });
  }

  public on(listener: (state: State) => void): () => void {
    this.eventEmitter.on('storeChanged', listener);
    return () => { this.off(listener) }
  }

  public off(listener: (state: State) => void): void {
    this.eventEmitter.off('storeChanged', listener);
  }
}

const storeEvent = new StoreListener(store);

export default storeEvent;