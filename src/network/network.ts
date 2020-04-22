import { Server } from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import ip from 'ip';

import { Log } from '../utils';

import { Address } from './address';
import { Peer } from './peer';
import { SignalServer } from './signal-server';

export interface NetworkOptions {
  host?: string;
  port?: number;
  maxBroadcasts?: number;
  initialPeers?: string[];
}

export class Network {
  private _server: Express;
  private _listener: Server;
  private _peers: Map<string, Peer> = new Map();
  private _maxBroadcasts: number = Infinity;

  public get address(): string {
    return new Address(ip.address()).toString();
  }

  public get peers(): Peer[] {
    return [...this._peers.values()];
  }

  public constructor(options?: NetworkOptions) {
    Log.info('Starting server...');
    this._server = express();
    this._server.use(compression());
    this._server.use(helmet());
    this._server.use(bodyParser.urlencoded({extended: true}));
    this._server.use(bodyParser.json());
    this._server.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'HEAD, OPTIONS, POST');
      res.header('Access-Control-Allow-Origin', '*');
      next();
    });
    if(options?.maxBroadcasts) this._maxBroadcasts = options.maxBroadcasts;
    const port: number = options?.port || 3390;
    const host: string = options?.host || '0.0.0.0';
    this._configureSignallingServer();
    this._listener = this._server.listen(port, host, () => {
      Log.info(`Server started on port ${port}`);
      if (options?.initialPeers) this._connectInitialPeers(options.initialPeers);
    });
  }

  private _configureSignallingServer(): void {
    const signalling: SignalServer = new SignalServer(this);
    this._server.use('/', signalling.router);
  }

  public isAddressValid(address: string): boolean {
    if (this.address === address) return false; // Avoid adding myself as a peer
    if (this.peers.some(peer => peer.address === address)) return false; // Avoid double adding a peer
    return true;
  }

  private async _connectInitialPeers(addresses: string[]): Promise<void> {
    Log.info(`Connecting to initial peers list: [${addresses.join('')}]`);
    (await Promise.all(addresses.map(async (peerAddress: string) => {
      const address: Address = new Address(peerAddress);
      try {
        if (!this.isAddressValid(address.toString())) return [];
        const peer: Peer = await this.addPeer(address.toString());
        Log.info(`Requesting new peers to ${address}...`);
        const newPeers = await peer.client.getPeers();
        return newPeers;
      } catch (e) {
        Log.error(`Failed to add ${address} as a peer.`);
        Log.error(e.message);
        return [];
      }
    })))
      .reduce((list, peerList) => list.concat(peerList), [])
      .forEach(peerAddress => {
        const address: Address = new Address(peerAddress);
        if (this.isAddressValid(address.toString())) {
          this.addPeer(address.toString());
        }
      });
  }

  public async addPeer(peerAddress: string): Promise<Peer> {
    Log.info(`Adding peer: ${peerAddress}`);
    const peer: Peer = new Peer(peerAddress);
    this._peers.set(peer.address, peer);
    Log.info(`Added peer: ${peer.address}`);
    Log.info(`Announcing myself as a peer to ${peer.address}...`);
    await peer.client.announce();
    return peer;
  }

  public async broadcastPeer(newPeer: Peer): Promise<void> {
    await Promise.all(
      this.peers
        .filter(peer => peer.address !== newPeer.address) // Avoid broadcasting the peer to itself
        .slice(0, this._maxBroadcasts)
        .map(peer => peer.client.announce(newPeer.address))
    );
  }

  public async broadcastData(data: any): Promise<void> {
    await Promise.all(
      this.peers
        .slice(0, this._maxBroadcasts)
        .map(peer => peer.client.broadcast(data))
    );
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._listener.close((error) => {
        return error ? reject(error) : resolve();
      });
    })
  }
}
