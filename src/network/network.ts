import { Server } from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import ip from 'ip';
import { parse as parseUrl } from 'url';

import { Log } from '../utils';

import { Peer } from './peer';
import { SignalServer } from './signal-server';
import { Client } from '../client';

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
    return ip.address();
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

  private async _connectInitialPeers(ips: string[]): Promise<void> {
    Log.info(`Connecting to initial peers list: [${ips.join('')}]`);
    (await Promise.all(ips.map(async (peerIp: any) => {
      peerIp = parseUrl(peerIp);
      try {
        if (ip.isEqual(this.address, peerIp.href)) return []; // Avoid adding myself as a peer
        if (this.peers.some(peer => peer.ip.href === peerIp.href)) return []; // Avoid double adding a peer
        const peer: Peer = await this.addPeer(peerIp.href);
        Log.info(`Requesting new peers to ${peerIp.href}...`);
        const newPeers = await peer.client.getPeers();
        Log.info(`Peers received: ${JSON.stringify(newPeers)}`);
        return newPeers;
      } catch (e) {
        Log.error(`Failed to add ${peerIp.href} as a peer.`);
        return [];
      }
    })))
      .reduce((list, peerList) => list.concat(peerList), [])
      .forEach(peerIp => this.addPeer(peerIp));
  }

  public async addPeer(peerIp: string): Promise<Peer> {
    const peer: Peer = new Peer(peerIp);
    Log.info(`Announced myself as a peer to ${peerIp}...`);
    await peer.client.announce();
    this._peers.set(peer.ip.href, peer);
    Log.info(`Added peer: ${peer.ip.href}`);
    return peer;
  }

  public async broadcastPeer(newPeer: Peer): Promise<void> {
    await Promise.all(
      this.peers
        .filter(peer => peer.ip !== newPeer.ip) // Avoid broadcasting the peer to itself
        .slice(0, this._maxBroadcasts)
        .map(peer => peer.client.announce(newPeer.ip.href))
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
