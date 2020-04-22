import { Address } from './address';
import { Client } from "../client";

export class Peer {
  private _address: Address;
  private _client: Client;

  public get address(): string {
    return this._address.toString();
  }

  public get client(): Client {
    return this._client;
  }

  public constructor(address: string) {
    this._address = new Address(address);
    this._client = new Client(this._address.toString());
  }
}