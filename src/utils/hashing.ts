import { createHash } from 'crypto';

export function generateHash(data: any): string {
  const dataHash = createHash('sha1');
  dataHash.update(JSON.stringify(data));
  return dataHash.digest('hex');
}