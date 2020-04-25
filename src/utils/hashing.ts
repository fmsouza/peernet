import { createHash } from "crypto";

export function generateHash(data: any, algorithm: string = "sha1"): string {
  if (typeof data !== "string") data = JSON.stringify(data);
  const dataHash = createHash(algorithm);
  dataHash.update(data);
  return dataHash.digest("hex");
}
