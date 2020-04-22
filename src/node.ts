import { Graph, GraphOptions } from './graph';
import { Identity, IdentityOptions } from './identity';
import { Network, NetworkOptions } from './network';
import { Storage, StorageOptions } from './storage';

interface Options {
  graph?: GraphOptions;
  identity?: IdentityOptions;
  network?: NetworkOptions;
  storage?: StorageOptions;
}

export class NodeDriver {
  private static _instance: NodeDriver;
  private _graph!: Graph;
  private _identity!: Identity;
  private _network!: Network;
  private _storage!: Storage;

  public get graph(): Graph {
    return this._graph;
  }

  public get identity(): Identity {
    return this._identity;
  }

  public get network(): Network {
    return this._network;
  }

  public get storage(): Storage {
    return this._storage;
  }

  public constructor(options?: Options) {
    if (NodeDriver._instance) return NodeDriver._instance;
    this._graph = new Graph(options?.graph);
    this._identity = new Identity(options?.identity);
    this._network = new Network(options?.network);
    this._storage = new Storage(options?.storage);
    NodeDriver._instance = this;
  }
}