import { Graph, GraphOptions } from "./graph";
import { Identity, IdentityOptions } from "./identity";
import { Network, NetworkOptions } from "./network";
import { Storage, StorageOptions } from "./storage";
import { generateKeyPair } from "./identity/utils";

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
    this._network = new Network(this._identity, options?.network);
    this._storage = new Storage(options?.storage);
    NodeDriver._instance = this;
  }

  public static async createNewKeys(): Promise<{
    privateKey: string;
    publicKey: string;
  }> {
    const keyPair = await generateKeyPair();
    return {
      privateKey: keyPair.privateKey.toString("hex"),
      publicKey: keyPair.publicKey.toString("hex"),
    };
  }
}
