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

type Nullable<T> = T | null;

export class NodeDriver {
  private static _instance: NodeDriver;
  private _graph: Nullable<Graph> = null;
  private _identity: Nullable<Identity> = null;
  private _network: Nullable<Network> = null;
  private _storage: Nullable<Storage> = null;

  public get graph(): Nullable<Graph> {
    return this._graph;
  }

  public get identity(): Nullable<Identity> {
    return this._identity;
  }

  public get network(): Nullable<Network> {
    return this._network;
  }

  public get storage(): Nullable<Storage> {
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