import { Address } from "./address";
import { Client } from "../client";

export class Peer {
  private _address: Address;
  private _client: Client;
  private _id: string;

  public get id(): string {
    return this._id;
  }

  public get address(): string {
    return this._address.toString();
  }

  public get client(): Client {
    return this._client;
  }

  public constructor(address: string, id: string) {
    this._id = id || "";
    this._address = new Address(address);
    this._client = new Client(this._address.toString(), id);
  }
}
