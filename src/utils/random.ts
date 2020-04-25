let cryptoModule: any;

async function nodeRandom(count: number): Promise<Buffer> {
  if (!cryptoModule) {
    cryptoModule = await import("crypto");
  }
  return cryptoModule.randomBytes(count);
}

async function browserRandom(count: number): Promise<Buffer> {
  const tmp: Uint8Array = new Uint8Array(count);
  window.crypto.getRandomValues(tmp);
  return new Buffer(tmp);
}

async function secureRandom(count: number): Promise<Buffer> {
  const isNode: boolean = Boolean(
    typeof process !== "undefined" &&
      typeof process.pid === "number" &&
      process.versions &&
      process.versions.node
  );
  return isNode ? nodeRandom(count) : browserRandom(count);
}

export function randomBuffer(count: number): Promise<Buffer> {
  return secureRandom(count);
}
