import { Graph, GraphOptions } from "./graph";
import { Identity, IdentityOptions, Emitter } from "./common";
import { Client, Network, NetworkOptions } from "./network";
import { Storage, StorageOptions } from "./storage";
import { generateKeyPair } from "./utils";

interface Options {
  graph?: GraphOptions;
  identity: IdentityOptions;
  network?: NetworkOptions;
  storage?: StorageOptions;
}

export class NodeDriver {
  private static _instance: NodeDriver;
  private _graph!: Graph;
  private _identity!: Identity;
  private _network!: Network;
  private _storage!: Storage;

  public get client(): Client {
    const id: string = this._identity.id;
    const address: string = this._network.address;
    return new Client(address, id);
  }

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

  public constructor(options: Options) {
    if (NodeDriver._instance) return NodeDriver._instance;
    this._identity = new Identity(options.identity);
    this._graph = new Graph(options?.graph);
    const emitter: Emitter = new Emitter(this._identity);

    this._storage = new Storage(emitter, options?.storage);
    this._network = new Network(
      emitter,
      this._identity,
      this._storage,
      options?.network
    );
    NodeDriver._instance = this;
  }

  public static createNewKeys(): { privateKey: string; publicKey: string } {
    const keyPair = generateKeyPair();
    return {
      privateKey: keyPair.privateKey.toString("hex"),
      publicKey: keyPair.publicKey.toString("hex"),
    };
  }
}
