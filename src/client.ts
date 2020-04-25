import axios from "axios";

import { NetworkSignals, Peer } from "./network";
import { Log, generateHash } from "./utils";

interface Ack {
  id: string;
}

export class Client {
  public constructor(private _address: string, private _id: string) {}

  public async request<T>(methodName: string, params: any = {}): Promise<T> {
    Log.info(`Sending '${methodName}' request to ${this._address}...`);
    const headers = {
      "Content-Type": "application/json",
      "X-Identity": this._id,
    };
    return axios({
      method: "POST",
      data: { methodName, params },
      headers,
      url: this._address,
    }).then((response) => response.data);
  }

  public ack(): Promise<Ack> {
    return this.request(NetworkSignals.HANDSHAKE);
  }

  public async announce(peer?: Peer): Promise<void> {
    await this.request<void>(NetworkSignals.ANNOUNCE_PEER, {
      address: peer?.address,
    });
  }

  public async add(data: any): Promise<string> {
    const hash: string = generateHash(data);
    await this.broadcast(hash, data);
    return hash;
  }

  public async broadcast(hash: string, data: any): Promise<void> {
    await this.request<void>(NetworkSignals.REQUEST_BROADCAST_DATA, {
      key: hash,
      data,
    });
  }

  public getPeers(): Promise<string[]> {
    return this.request<string[]>(NetworkSignals.REQUEST_PEERS);
  }
}
