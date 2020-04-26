import { Server } from "http";
import ip from "ip";

import { Address, Command, Emitter, Identity } from "../common";
import { DataNode, Storage, StorageSignals } from "../storage";
import { Log, timeout } from "../utils";

import { Client } from "./client";
import { Peer } from "./peer";
import { NetworkSignals } from "./signals";
import { SignalServer } from "./signal-server";
import { NetworkOptions } from "./types";

export class Network {
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

  public constructor(
    public emitter: Emitter,
    public identity: Identity,
    public storage: Storage,
    options?: NetworkOptions
  ) {
    Log.info("Starting server...");
    if (options?.maxBroadcasts) this._maxBroadcasts = options.maxBroadcasts;
    this._server = new SignalServer(this, options);
    this._listener = this._server.listen();
    this.emitter.on(
      NetworkSignals.ANNOUNCE_PEER,
      this._onPeerAnnounced.bind(this)
    );
    this.emitter.on(
      NetworkSignals.REQUEST_KEY_DATA,
      this._onRequestData.bind(this)
    );
    this.emitter.on(
      NetworkSignals.BROADCAST_DATA,
      this._onBroadcastData.bind(this)
    );
    this.emitter.on(NetworkSignals.HANDSHAKE, this._onHandshake.bind(this));
    this.emitter.on(
      NetworkSignals.REQUEST_BROADCAST_DATA,
      this._onBroadcastRequest.bind(this)
    );
    this.emitter.on(
      NetworkSignals.REQUEST_PEERS,
      this._onPeersRequested.bind(this)
    );
    this.emitter.on(NetworkSignals.FINISH, this._onFinish.bind(this));
  }

  public isKnownPeer(peer: Peer): boolean {
    const id: string = this.identity.id;
    return id === peer.id || this.peers.some((p) => p.id === peer.id); // Avoids self adding or double adding a peer
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
        .filter((peer) => peer.id !== newPeer.id) // Avoid broadcasting the peer to itself
        .slice(0, this._maxBroadcasts)
        .map((peer) => peer.client.announce(newPeer))
    );
  }

  public async requestData(key: string): Promise<DataNode> {
    if (await this.storage.has(key)) {
      return this.storage.get(key);
    }
    const node: DataNode = await Promise.race(
      this.peers.map((peer) => peer.client.get(key))
    ); // If I don't have it, I request my peers and they request theirs, until someone has it.
    if (node) {
      await this.storage.create(key, node);
    }
    return node;
  }

  public async broadcastData(key: string, data: any): Promise<void> {
    await Promise.all(
      this.peers
        .slice(0, this._maxBroadcasts)
        .map((peer) => peer.client.broadcast(key, data))
    );
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._listener.close((error) => {
        return error ? reject(error) : resolve();
      });
    });
  }

  private async _onBroadcastData(command: Command): Promise<void> {
    const response = { status: 200, body: NetworkSignals.OK };
    try {
      const { key, data } = await command.getData();
      if (!(await this.storage.has(key))) {
        await this.storage.create(key, data);
      }
      await this.broadcastData(key, data);
    } catch (e) {
      response.status = e.code || 500;
      response.body = e.message;
    } finally {
      command.setResponse(response.status, response.body);
      this.emitter.emitFinish(command);
    }
  }

  private async _onRequestData(command: Command): Promise<void> {
    const response = { status: 200, body: null as any };
    try {
      const { key } = await command.getData();
      response.body = await Promise.race([
        this.requestData(key),
        timeout(5000).then(() => null),
      ]);
    } catch (e) {
      response.status = e.code || 500;
      response.body = e.message;
    } finally {
      command.setResponse(response.status, response.body);
      this.emitter.emitFinish(command);
    }
  }

  private async _onPeerAnnounced(command: Command): Promise<void> {
    Log.info(`New peer just announced!`);
    const response = { status: 200, body: NetworkSignals.OK };
    try {
      const data: any = await command.getData<any>();
      let peer: Peer;
      Log.info(`Checking if the address is in the body...`);
      if (data?.address) {
        Log.info("Requesting the ID for the new peer...");
        const hostId: string = this.identity.id;
        const client: Client = new Client(this.address, hostId);
        const { id } = await client.ack(data.address);
        peer = new Peer(data.address, id);
      } else {
        Log.info("Getting the requester details...");
        peer = await command.getPeer();
      }
      Log.info(`(${peer.address}) ${peer.id}`);
      if (!this.isKnownPeer(peer)) {
        Log.info(`It's not known. Adding...`);
        await Promise.all([this.addPeer(peer), this.broadcastPeer(peer)]);
        Log.info(`Getting it's neighbors...`);
        const neighbors: string[] = await peer.client.getPeers();
        neighbors.forEach((address: string) =>
          this._server.handleAddressAsPeer(address)
        );
      }
    } catch (e) {
      response.status = e.code || 500;
      response.body = e.message;
      Log.error(e.message);
    } finally {
      command.setResponse(response.status, response.body);
      this.emitter.emitFinish(command);
    }
  }

  private async _onHandshake(command: Command): Promise<void> {
    const id: string = this.identity.id;
    const response = { status: 200, body: { id } };
    command.setResponse(response.status, response.body);
    this.emitter.emitFinish(command);
  }

  private async _onPeersRequested(command: Command): Promise<void> {
    const peerAddresses: string[] = this.peers.map((peer) => peer.address);
    const response = { status: 200, body: peerAddresses };
    command.setResponse(response.status, response.body);
    this.emitter.emitFinish(command);
  }

  private async _onBroadcastRequest(command: Command): Promise<void> {
    this.emitter.emit(StorageSignals.SAVE_DATA, command);
  }

  private async _onFinish(command: Command): Promise<void> {
    const response = { status: 200, body: NetworkSignals.OK };
    command.setResponse(response.status, response.body);
    this.emitter.emitFinish(command);
  }
}
