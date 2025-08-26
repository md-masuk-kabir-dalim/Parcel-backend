import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new UUID v4
 * @returns {string} A unique UUID string
 */
export function generateUUID(): string {
  return uuidv4();
}
