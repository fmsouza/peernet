import { randomBuffer } from "../utils";
import { Peer } from "./peer";

export class Command {
  private _id!: string;
  private _data: any;
  private _peer: Peer;

  public constructor(address: string, identity: string, data: any = null) {
    this._peer = new Peer(address, identity);
    this._data = data;
  }

  public async getData<T>(): Promise<T> {
    return this._data;
  }

  public async getEndSignal(): Promise<string> {
    const id: string = await this.getId();
    return `${id}:END`;
  }

  public async getId(): Promise<string> {
    if (!this._id) {
      this._id = (await randomBuffer(32)).toString("hex");
    }
    return this._id;
  }

  public async getPeer(): Promise<Peer> {
    return this._peer;
  }
}
