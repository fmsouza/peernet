import { Server } from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import ip from 'ip';

import { Log } from '../utils';

import { Peer } from './types';
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
    this._listener = this._server.listen(port, host, () => Log.info(`Server started on port ${port}`));
    if (options?.initialPeers) this._connectInitialPeers(options.initialPeers);
  }

  private _configureSignallingServer(): void {
    const signalling: SignalServer = new SignalServer(this);
    this._server.use('/', signalling.router);
  }

  private _connectInitialPeers(ips: string[]): void {
    ips.forEach(peerIp => this.addPeer(peerIp));
  }

  public addPeer(peerIp: string): Peer | null {
    if (ip.isEqual(this.address, peerIp)) return null; // Avoid adding myself as a peer
    if (this._peers.has(peerIp)) return null; // Avoid double adding peers

    Log.info(`Adding peer: ${peerIp}`);
    const peer: Peer = {
      ip: peerIp,
      client: new Client(peerIp),
    }
    this._peers.set(peer.ip, peer);
    return peer;
  }

  public async broadcastPeer(newPeer: Peer): Promise<void> {
    await Promise.all(
      this.peers
        .filter(peer => peer.ip !== newPeer.ip) // Avoid broadcasting the peer to itself
        .slice(0, this._maxBroadcasts)
        .map(peer => peer.client.announce(newPeer.ip))
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
