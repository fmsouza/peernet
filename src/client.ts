import axios from 'axios';

import { Signal, Log } from './utils';

export class Client {
  private _address: string;

  public constructor(address: string) {
    if (!address.startsWith('http')) address = `http://${address}`;
    address = `${address}:3390/`;
    this._address = address;
  }

  public async request<T>(methodName: string, data: any = {}): Promise<T> {
    Log.info(`Sending ${methodName} request to ${this._address}...`);
    const headers = {
      'Content-Type': 'application/json'
    };
    return axios({
      method: 'POST',
      data,
      headers,
      url: this._address,
    // tslint:disable-next-line: no-shadowed-variable
    }).then(({ data }) => data);
  }

  public ack(): Promise<void> {
    return this.request(Signal.HANDSHAKE);
  }

  public async announce(ip?: string): Promise<void> {
    await this.request<void>(Signal.ANNOUNCE_PEER, { ip });
  }

  public async broadcast(data: any): Promise<void> {
    await this.request<void>(Signal.BROADCAST_DATA, { data });
  }

  public getPeers(): Promise<string[]> {
    return this.request<string[]>(Signal.REQUEST_PEERS);
  }
}