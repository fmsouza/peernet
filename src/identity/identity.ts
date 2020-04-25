import { KeyPair } from "./types";
import { Emitter, generateHash } from "../utils";

export interface IdentityOptions {
  keyPair: { privateKey: string; publicKey: string };
}

export class Identity extends Emitter {
  private _keyPair!: KeyPair;

  public get keys(): KeyPair {
    return this._keyPair;
  }

  public constructor(options: IdentityOptions) {
    super();
    const { privateKey, publicKey } = options.keyPair;
    this.__configureKeyPair(privateKey, publicKey);
  }

  public id(): string {
    return generateHash(this._keyPair.publicKey.toString("hex"), "sha256");
  }

  private __configureKeyPair(privateKey: string, publicKey: string): void {
    this._keyPair = {
      privateKey: Buffer.from(privateKey, "hex"),
      publicKey: Buffer.from(publicKey, "hex"),
    };
  }
}
