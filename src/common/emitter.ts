import { EventEmitter } from "events";
import ip from "ip";

import { Address } from "./address";
import { Command } from "./command";
import { Identity } from "./identity";
import { Peer } from "../network";

export class Emitter {
  private static _events: EventEmitter;

  private get _address(): string {
    return new Address(ip.address()).toString();
  }

  private get events(): EventEmitter {
    return Emitter._events;
  }

  public constructor(private _identity: Identity) {
    if (!Emitter._events) {
      Emitter._events = new EventEmitter();
    }
  }

  public async emitCommand(event: string, command: Command): Promise<void> {
    this.events.emit(event, command);
  }

  public emit(event: string, payload?: any): void {
    const peer: Peer = new Peer(this._address, this._identity.id);
    const command: Command = new Command(peer, payload);
    this.emitCommand(event, command);
  }

  public on(event: string, fn: (...args: any[]) => void): void {
    this.events.on(event, fn);
  }

  public async emitFinish(command: Command): Promise<void> {
    this.emitCommand(await command.getEndSignal(), command);
  }

  public async end(
    command: Command,
    fn: (...args: any[]) => void
  ): Promise<void> {
    this.on(await command.getEndSignal(), async () => {
      fn(await command.getResponse());
    });
  }
}
