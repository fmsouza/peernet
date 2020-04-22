import axios from 'axios';

import { Signal, Log } from './utils';

export class Client {

  public constructor(private _address: string) {}

  public async request<T>(methodName: string, params: any = {}): Promise<T> {
    Log.info(`Sending '${methodName}' request to ${this._address}...`);
    const headers = {
      'Content-Type': 'application/json'
    };
    return axios({
      method: 'POST',
      data: { methodName, params },
      headers,
      url: this._address,
    // tslint:disable-next-line: no-shadowed-variable
    }).then(({ data }) => data);
  }

  public ack(): Promise<void> {
    return this.request(Signal.HANDSHAKE);
  }

  public async announce(address?: string): Promise<void> {
    await this.request<void>(Signal.ANNOUNCE_PEER, { address });
  }

  public async broadcast(data: any): Promise<void> {
    await this.request<void>(Signal.BROADCAST_DATA, { data });
  }

  public getPeers(): Promise<string[]> {
    return this.request<string[]>(Signal.REQUEST_PEERS);
  }
}