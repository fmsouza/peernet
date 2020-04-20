import bent, { RequestFunction, ValidResponse } from 'bent';

import { Peer } from './network';
import { Signal } from './utils';

export class Client {
  private _client: RequestFunction<ValidResponse> = bent('json');

  public constructor(address: string) {
    if (!address.startsWith('http')) address = `http://${address}`;
    address = `${address}:3390/`;
    this._client = bent(address, 'POST', 'json');
  }

  public request(methodName: string, params: any = {}): Promise<ValidResponse> {
    return this._client('/', { methodName, params });
  }

  public async announce(ip?: string): Promise<void> {
    await this.request(Signal.ANNOUNCE_PEER, { ip });
  }

  public async broadcast(data: any): Promise<void> {
    await this.request(Signal.BROADCAST_DATA, { data });
  }

  public async getPeers(): Promise<Peer[]> {
    const peerIps = (await this.request(Signal.REQUEST_PEERS)) as string[];
    return peerIps.map(peerIp => ({
      ip: peerIp,
      client: new Client(peerIp),
    }));
  }
}