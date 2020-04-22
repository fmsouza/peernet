import { Server } from 'http';
import ip from 'ip';

import { StorageSignals } from '../storage';
import { Log, Emitter } from '../utils';

import { Address } from './address';
import { Command } from './command';
import { Peer } from './peer';
import { NetworkSignals } from './signals';
import { SignalServer } from './signal-server';
import { NetworkOptions } from './types';

export class Network extends Emitter {
  private _server: SignalServer;
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
    super();
    Log.info('Starting server...');
    if(options?.maxBroadcasts) this._maxBroadcasts = options.maxBroadcasts;
    this._server = new SignalServer(this, options);
    this._listener = this._server.listen();
    this.on(NetworkSignals.ANNOUNCE_PEER, this._onPeerAnnounced.bind(this));
    this.on(NetworkSignals.BROADCAST_DATA, this._onBroadcastData.bind(this));
    this.on(NetworkSignals.HANDSHAKE, this._onHandshake.bind(this));
    this.on(NetworkSignals.REQUEST_BROADCAST_DATA, this._onBroadcastRequest.bind(this));
    this.on(NetworkSignals.REQUEST_PEERS, this._onPeersRequested.bind(this));
    this.on(NetworkSignals.FINISH, this._onFinish.bind(this));
  }

  public isKnownPeer(peer: Peer): boolean {
    return (this.address === peer.address || this.peers.some(p => p.address === peer.address)); // Avoids self adding or double adding a peer
  }

  public async addPeer(peer: Peer): Promise<Peer> {
    Log.info(`Adding peer: ${peer.address}`);
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

  public async broadcastData(id: string, data: any): Promise<void> {
    await Promise.all(
      this.peers
        .slice(0, this._maxBroadcasts)
        .map(peer => peer.client.broadcast(id, data))
    );
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._listener.close((error) => {
        return error ? reject(error) : resolve();
      });
    })
  }

  private async _onBroadcastData(command: Command): Promise<void> {
    const { id, data } = command.data;
    const response = { status: 200, body: NetworkSignals.OK };
    try {
      await this.broadcastData(id, data);
    } catch (e) {
      response.status = e.code || 500;
      response.body = e.message;
    } finally {
      this.emit(command.end, response);
    }
  }

  private async _onPeerAnnounced(command: Command): Promise<void> {
    const peer: Peer = command.data?.address ? new Peer(command.data?.address) : command.peer;
    const response = { status: 200, body: NetworkSignals.OK };
    try {
      if (!this.isKnownPeer(peer)) {
        await Promise.all([
          this.addPeer(peer),
          this.broadcastPeer(peer)
        ]);
      }
    } catch (e) {
      response.status = e.code || 500;
      response.body = e.message;
    } finally {
      this.emit(command.end, response);
    }
  }

  private async _onHandshake(command: Command): Promise<void> {
    return this._onFinish(command);
  }

  private async _onPeersRequested(command: Command): Promise<void> {
    const peerAddresses: string[] = this.peers.map(peer => peer.address);
    const response = { status: 200, body: peerAddresses };
    this.emit(command.end, response);
  }

  private async _onBroadcastRequest(command: Command): Promise<void> {
    this.emit(StorageSignals.SAVE_DATA, command);
  }

  private async _onFinish(command: Command): Promise<void> {
    const response = { status: 200, body: NetworkSignals.OK };
    this.emit(command.end, response);
  }
}
