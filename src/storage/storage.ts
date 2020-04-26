import { Command, Emitter } from "../common";
import { generateHash } from "../utils";

import { StorageSignals } from "./signals";
import { StorageOptions } from "./types";

export class Storage {
  private _store: Map<string, any> = new Map();

  public constructor(private _emitter: Emitter, options?: StorageOptions) {
    this._emitter.on(
      StorageSignals.SAVE_DATA,
      this._saveReceivedData.bind(this)
    );
  }

  public async has(key: string): Promise<boolean> {
    return this._store.has(key);
  }

  public async get<T>(key: string): Promise<T> {
    return this._store.get(key);
  }

  public async create(key: string, data: any): Promise<void> {
    this._store.set(key, data);
  }

  public async add(data: any): Promise<string> {
    const key: string = await this.saveData(data);
    return key;
  }

  private async saveData(data: any): Promise<string> {
    const hash: string = generateHash(data);
    if (!(await this.has(hash))) {
      await this.create(hash, data);
    }
    return hash;
  }

  private async _saveReceivedData(command: Command): Promise<void> {
    const response = { status: 200, body: null };
    try {
      const { data } = await command.getData();
      const key: any = await this.saveData(data);
      response.body = key;
    } catch (e) {
      response.status = 500;
      response.body = e.message;
    } finally {
      this._emitter.emitFinish(command);
    }
  }
}
