import { Command, NetworkSignals } from "../network";
import { Emitter } from "../utils";

import { StorageSignals } from "./signals";
import { StorageOptions } from "./types";

const store: Map<string, any> = new Map();

export class Storage extends Emitter {
  public constructor(options?: StorageOptions) {
    super();
    this.on(StorageSignals.SAVE_DATA, this._saveReceivedData.bind(this));
  }

  public has(key: string): boolean {
    return store.has(key);
  }

  public async get(key: string): Promise<any> {
    return store.get(key);
  }

  public async save(key: string, data: any): Promise<void> {
    store.set(key, data);
  }

  private async _saveReceivedData(command: Command): Promise<void> {
    const { key, data } = await command.getData();
    if (this.has(key)) {
      this.emit(NetworkSignals.FINISH, command);
    } else {
      await this.save(key, data);
      this.emit(NetworkSignals.BROADCAST_DATA, command);
    }
  }
}
