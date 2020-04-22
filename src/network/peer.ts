import { Client } from "../client";
import { Url, parse } from 'url';


export class Peer {
  private _ip: Url;
  private _client: Client;

  public get ip(): Url {
    return this._ip;
  }

  public get client(): Client {
    return this._client;
  }

  public constructor(ip: string) {
    this._ip = parse(ip);
    this._client = new Client(this._ip.href);
  }
}