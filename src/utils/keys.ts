import { ec as EllipticCurve } from "elliptic";

import { KeyPair } from "../common";

const ecdsa: EllipticCurve = new EllipticCurve("secp256k1");

export function generateKeyPair(): KeyPair {
  const keys: EllipticCurve.KeyPair = ecdsa.genKeyPair();
  return {
    privateKey: Buffer.from(keys.getPrivate("hex"), "hex"),
    publicKey: Buffer.from(keys.getPublic("hex"), "hex"),
  };
}
