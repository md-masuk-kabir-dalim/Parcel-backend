import { customAlphabet } from 'nanoid';
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET, 8);

export function generateUniqueId(prefix: string): string {
  return `${prefix}${nanoid()}`;
}
