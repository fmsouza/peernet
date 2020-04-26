import { Command } from "../network";
import { Emitter, generateHash } from "../utils";

import { StorageSignals } from "./signals";
import { StorageOptions } from "./types";

const store: Map<string, any> = new Map();

export class Storage extends Emitter {
  public constructor(options?: StorageOptions) {
    super();
    this.on(StorageSignals.SAVE_DATA, this._saveReceivedData.bind(this));
  }

  public async has(key: string): Promise<boolean> {
    return store.has(key);
  }

  public async get<T>(key: string): Promise<T> {
    return store.get(key);
  }

  public async save(key: string, data: any): Promise<void> {
    store.set(key, data);
  }

  private async _saveReceivedData(command: Command): Promise<void> {
    const response = { status: 200, body: null };
    try {
      const { data } = await command.getData();
      const hash: string = generateHash(data);
      if (!this.has(hash)) {
        await this.save(hash, data);
        response.body = hash as any;
      }
    } catch (e) {
      response.status = 500;
      response.body = e.message;
    } finally {
      this.emit(await command.getEndSignal(), response);
    }
  }
}
