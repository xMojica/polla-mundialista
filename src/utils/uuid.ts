import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique UUID v4 identifier
 * @returns A unique UUID string
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Creates a composite key from two IDs
 * Useful for creating unique keys for predictions (participantId:matchId)
 * @param id1 First identifier (e.g., participantId)
 * @param id2 Second identifier (e.g., matchId)
 * @returns A composite key in the format "id1:id2"
 */
export function createCompositeKey(id1: string, id2: string): string {
  return `${id1}:${id2}`;
}

/**
 * Parses a composite key into its constituent parts
 * @param compositeKey A composite key in the format "id1:id2"
 * @returns An object with id1 and id2, or null if the key is invalid
 */
export function parseCompositeKey(compositeKey: string): { id1: string; id2: string } | null {
  const parts = compositeKey.split(':');
  if (parts.length !== 2) {
    return null;
  }
  return {
    id1: parts[0],
    id2: parts[1],
  };
}
