export interface StorageOptions {}

export class Storage {

  private _data: any = {};
  public constructor(options?: StorageOptions) {}

  public async save(data: any): Promise<string> {
    const timestamp = new Date().toISOString();
    this._data[timestamp] = data;
    return timestamp;
  }
}