import axios from "axios";

import { Log } from "../utils";
import { DataNode, StorageSignals } from "../storage";
import { Peer } from "./peer";
import { NetworkSignals } from "./signals";

interface Ack {
  id: string;
}

export class Client {
  public constructor(private _address: string, private _id: string) {}

  public async request<T>(
    methodName: string,
    params: any = {},
    url: string = this._address
  ): Promise<T> {
    Log.info(`Sending '${methodName}' request to ${url}...`);
    const headers = {
      "Content-Type": "application/json",
      "X-Identity": this._id,
    };
    return axios({
      method: "POST",
      data: { methodName, params },
      headers,
      url,
    }).then((response) => response.data);
  }

  public ack(address: string = this._address): Promise<Ack> {
    return this.request(NetworkSignals.HANDSHAKE, {}, address);
  }

  public async announce(peer?: Peer): Promise<void> {
    await this.request<void>(NetworkSignals.ANNOUNCE_PEER, {
      address: peer?.address,
    });
  }

  public async add(data: any): Promise<string> {
    const key: string = await this.request(StorageSignals.SAVE_DATA, { data });
    await this.broadcast(key, data);
    return key;
  }

  public async get(key: string): Promise<DataNode> {
    return this.request<DataNode>(NetworkSignals.REQUEST_KEY_DATA, {
      key,
    });
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
