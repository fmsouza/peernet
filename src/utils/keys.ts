import { ec as EllipticCurve } from "elliptic";

import { randomBuffer } from "../utils";
import { KeyPair } from "../common";

const ecdsa: EllipticCurve = new EllipticCurve("secp256k1");

async function generatePrivateKey(): Promise<Buffer> {
  const max: Buffer = Buffer.from(
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140",
    "hex"
  );
  let privateKey: Buffer = await randomBuffer(32);
  while (Buffer.compare(privateKey, max) !== 1) {
    privateKey = await randomBuffer(32);
  }
  return privateKey;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const privateKey: Buffer = await generatePrivateKey();
  const keys: EllipticCurve.KeyPair = ecdsa.keyFromPrivate(privateKey);
  return {
    privateKey,
    publicKey: Buffer.from(keys.getPublic("hex"), "hex"),
  };
}
