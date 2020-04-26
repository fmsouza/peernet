import { Command, Emitter } from "../common";
import { generateHash } from "../utils";

import { StorageSignals } from "./signals";
import { DataNode, StorageOptions } from "./types";

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

  public async get(key: string): Promise<DataNode> {
    return this._store.get(key);
  }

  public async create(key: string, node: DataNode): Promise<void> {
    this._store.set(key, node);
  }

  public async add(data: any): Promise<string> {
    const key: string = await this.saveData(data);
    return key;
  }

  private async saveData(data: any): Promise<string> {
    const timestamp: string = new Date().toISOString();
    const node: DataNode = {
      data,
      timestamp,
    };
    const hash: string = generateHash(node);
    await this.create(hash, node);
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
