import axios from 'axios';

import { NetworkSignals, Peer } from './network';
import { Log, randomId } from './utils';

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
    return this.request(NetworkSignals.HANDSHAKE);
  }

  public async announce(address?: string): Promise<void> {
    await this.request<void>(NetworkSignals.ANNOUNCE_PEER, { address });
  }

  public async add(data: any): Promise<string> {
    const id: string = randomId();
    await this.broadcast(id, data);
    return id;
  }

  public async broadcast(id: string, data: any): Promise<void> {
    await this.request<void>(NetworkSignals.REQUEST_BROADCAST_DATA, { id, data });
  }

  public async getPeers(): Promise<Peer[]> {
    const peerAddresses: string[] = await this.request<string[]>(NetworkSignals.REQUEST_PEERS);
    return peerAddresses.map(address => new Peer(address));
  }
}