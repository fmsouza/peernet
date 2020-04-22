export interface StorageOptions {}

const store: Map<string, any> = new Map();

export class Storage {

  public constructor(options?: StorageOptions) {}

  public has(key: string): boolean {
    return store.has(key);
  }

  public async get(key: string): Promise<any> {
    return store.get(key);
  }

  public async save(data: any, key?: string): Promise<string> {
    if (!key) key = new Date().toISOString();
    store.set(key, data);
    return key;
  }
}