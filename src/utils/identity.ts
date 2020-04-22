import { customAlphabet } from 'nanoid/non-secure';

const idGen: Function = customAlphabet('123456789abcdefghjkmnpqrstuvwxyz', 32);

export function randomId(): string {
  return idGen();
}