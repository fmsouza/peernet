import { NodeDriver } from './node';

export interface StorageOptions {}

export class Storage {
  private _data: any = {};

  public constructor(options?: StorageOptions) {}

  public has(key: string): boolean {
    return Boolean(this._data[key]);
  }

  public async get(key: string): Promise<any> {
    return this._data[key] || null;
  }

  public async save(data: any, key?: string): Promise<string> {
    if (!key) key = new Date().toISOString();
    const node: NodeDriver = new NodeDriver();
    this._data[key] = data;
    await node.network?.broadcastData(key, data);
    return key;
  }
}