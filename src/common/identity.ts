import { generateHash } from "../utils";
import { KeyPair } from "./types";

export interface IdentityOptions {
  keyPair: { privateKey: string; publicKey: string };
}

export class Identity {
  private _keyPair!: KeyPair;

  public get keys(): KeyPair {
    return this._keyPair;
  }

  public get id(): string {
    return generateHash(this._keyPair.publicKey.toString("hex"), "sha256");
  }

  public constructor(options: IdentityOptions) {
    const { privateKey, publicKey } = options.keyPair;
    this.__configureKeyPair(privateKey, publicKey);
  }

  private __configureKeyPair(privateKey: string, publicKey: string): void {
    this._keyPair = {
      privateKey: Buffer.from(privateKey, "hex"),
      publicKey: Buffer.from(publicKey, "hex"),
    };
  }
}
