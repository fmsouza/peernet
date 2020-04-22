import { randomId } from '../utils';
import { Peer } from './peer';

export class Command {
  private _id: string;
  private _data: any;
  private _peer: Peer;

  public id(): string {
    return this._id;
  }

  public get data(): any {
    return this._data;
  }

  public get peer(): Peer {
    return this._peer;
  }

  public get end(): string {
    return `${this.id}:END`;
  }

  public constructor(address: string, data: any = null) {
    this._id = randomId();
    this._peer = new Peer(address);
    this._data = data;
  }
}