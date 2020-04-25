import { KeyPair } from "./types";
import { generateKeyPair } from "./utils";
import { Emitter, generateHash } from "../utils";

export interface IdentityOptions {
  keyPair?: KeyPair;
}

export class Identity extends Emitter {
  private _ready: boolean = false;
  private _keyPair!: KeyPair;

  public get keys(): KeyPair {
    return this._keyPair;
  }

  public constructor(options?: IdentityOptions) {
    super();
    this._configureIdentity(options?.keyPair);
  }

  public async id(): Promise<string> {
    await this.ready();
    return generateHash(this._keyPair.publicKey.toString("hex"), "sha256");
  }

  public ready(): Promise<void> {
    return new Promise((resolve) => {
      while (!this._ready) {
        // really just wait for a bit
      }
      resolve();
    });
  }

  private async _configureIdentity(keyPair?: KeyPair): Promise<void> {
    if (!keyPair) {
      keyPair = await this._createNewIdentity();
    }
    this._keyPair = keyPair;
    this._ready = true;
  }

  private async _createNewIdentity(): Promise<KeyPair> {
    const newKeyPair: KeyPair = await generateKeyPair();
    return newKeyPair;
  }
}
