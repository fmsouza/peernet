import { EventEmitter } from 'events';

export class Emitter {
  private static _events: EventEmitter;

  public constructor() {
    if (!Emitter._events) {
      Emitter._events = new EventEmitter();
    }
  }

  public emit(event: string, payload?: any): void {
    Emitter._events.emit(event, payload);
  }

  public on(event: string, fn: (...arg: any[]) => void): void {
    Emitter._events.on(event, fn);
  }
}
