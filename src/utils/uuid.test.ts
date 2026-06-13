import { describe, it, expect } from 'vitest';
import { generateId, createCompositeKey, parseCompositeKey } from './uuid';

describe('UUID Utility', () => {
  describe('generateId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateId();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs of consistent length', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1.length).toBe(36); // UUID v4 standard length with hyphens
      expect(id2.length).toBe(36);
    });
  });

  describe('createCompositeKey', () => {
    it('should create a composite key with colon separator', () => {
      const key = createCompositeKey('participant-123', 'match-456');
      expect(key).toBe('participant-123:match-456');
    });

    it('should handle UUID strings', () => {
      const participantId = generateId();
      const matchId = generateId();
      const key = createCompositeKey(participantId, matchId);
      
      expect(key).toBe(`${participantId}:${matchId}`);
      expect(key).toContain(':');
    });

    it('should handle empty strings', () => {
      const key1 = createCompositeKey('', 'match-456');
      const key2 = createCompositeKey('participant-123', '');
      const key3 = createCompositeKey('', '');
      
      expect(key1).toBe(':match-456');
      expect(key2).toBe('participant-123:');
      expect(key3).toBe(':');
    });

    it('should handle IDs containing special characters', () => {
      const key = createCompositeKey('participant-abc', 'match-xyz-789');
      expect(key).toBe('participant-abc:match-xyz-789');
    });
  });

  describe('parseCompositeKey', () => {
    it('should parse a valid composite key', () => {
      const key = 'participant-123:match-456';
      const result = parseCompositeKey(key);
      
      expect(result).not.toBeNull();
      expect(result?.id1).toBe('participant-123');
      expect(result?.id2).toBe('match-456');
    });

    it('should parse composite keys with UUID strings', () => {
      const participantId = generateId();
      const matchId = generateId();
      const key = createCompositeKey(participantId, matchId);
      const result = parseCompositeKey(key);
      
      expect(result).not.toBeNull();
      expect(result?.id1).toBe(participantId);
      expect(result?.id2).toBe(matchId);
    });

    it('should handle empty string components', () => {
      const result1 = parseCompositeKey(':match-456');
      const result2 = parseCompositeKey('participant-123:');
      const result3 = parseCompositeKey(':');
      
      expect(result1).not.toBeNull();
      expect(result1?.id1).toBe('');
      expect(result1?.id2).toBe('match-456');
      
      expect(result2).not.toBeNull();
      expect(result2?.id1).toBe('participant-123');
      expect(result2?.id2).toBe('');
      
      expect(result3).not.toBeNull();
      expect(result3?.id1).toBe('');
      expect(result3?.id2).toBe('');
    });

    it('should return null for invalid keys without colon', () => {
      const result = parseCompositeKey('participant-123-match-456');
      expect(result).toBeNull();
    });

    it('should return null for keys with multiple colons', () => {
      const result = parseCompositeKey('participant-123:match-456:extra');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseCompositeKey('');
      expect(result).toBeNull();
    });

    it('should correctly round-trip create and parse', () => {
      const id1 = generateId();
      const id2 = generateId();
      const key = createCompositeKey(id1, id2);
      const result = parseCompositeKey(key);
      
      expect(result).not.toBeNull();
      expect(result?.id1).toBe(id1);
      expect(result?.id2).toBe(id2);
    });
  });
});
