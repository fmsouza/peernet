type KeyPair = null | {
  privateKey: string;
  publicKey: string;
}

export interface IdentityOptions {
  keyPair?: KeyPair;
}

export class Identity {
  private _keyPair: KeyPair = null;

  public get keys(): KeyPair {
    return this._keyPair;
  }

  public constructor(options?: IdentityOptions) {
    if (options?.keyPair) {
      this._keyPair = options?.keyPair;
    } else {
      this.create();
    }
  }

  public async getId(): Promise<string> {
    return '';
  }

  public async create(): Promise<KeyPair> {
    const newKeyPair: KeyPair = null;
    this._keyPair = newKeyPair;
    return newKeyPair;
  }
}