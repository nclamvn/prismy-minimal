// Use dynamic import to avoid initialization issues
let ChunkerService: any;

beforeAll(async () => {
  const module = await import('../index');
  ChunkerService = module.ChunkerService;
});

describe('ChunkerService', () => {
  let chunkerService: any;

  beforeEach(() => {
    chunkerService = new ChunkerService();
  });

  describe('chunkDocument', () => {
    const sampleText = 'This is a test document. It has multiple sentences. We will test chunking functionality.';

    it('should chunk text for basic tier', async () => {
      const result = await chunkerService.chunkDocument(sampleText, 'basic');
      
      expect(result).toHaveProperty('chunks');
      expect(result).toHaveProperty('totalTokens');
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.chunks[0]).toHaveProperty('content');
      expect(result.chunks[0]).toHaveProperty('tokens');
    });

    it('should chunk text for standard tier', async () => {
      const result = await chunkerService.chunkDocument(sampleText, 'standard');
      
      expect(result).toHaveProperty('chunks');
      expect(result.chunks.length).toBeGreaterThan(0);
    });

    it('should chunk text for premium tier', async () => {
      const result = await chunkerService.chunkDocument(sampleText, 'premium');
      
      expect(result).toHaveProperty('chunks');
      expect(result.chunks.length).toBeGreaterThan(0);
    });

    it('should handle empty text', async () => {
      const result = await chunkerService.chunkDocument('', 'basic');
      
      expect(result.chunks).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
    });

    it('should handle very long text', async () => {
      const longText = sampleText.repeat(100);
      const result = await chunkerService.chunkDocument(longText, 'standard');
      
      expect(result.chunks.length).toBeGreaterThan(1);
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should preserve text integrity', async () => {
      const result = await chunkerService.chunkDocument(sampleText, 'basic');
      
      // Reconstruct text from chunks
      const reconstructed = result.chunks
        .map((chunk: any) => chunk.content)
        .join('');
      
      // Should contain all original text (might have extra spaces)
      expect(reconstructed.replace(/\s+/g, ' ').trim())
        .toBe(sampleText.replace(/\s+/g, ' ').trim());
    });

    it('should create unique chunk IDs', async () => {
      const result = await chunkerService.chunkDocument(sampleText, 'basic');
      
      const ids = result.chunks.map((chunk: any) => chunk.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include metadata in chunks', async () => {
      const result = await chunkerService.chunkDocument(sampleText, 'premium');
      
      expect(result.chunks[0]).toHaveProperty('metadata');
      // Metadata should have useful information
      const metadata = result.chunks[0].metadata;
      expect(metadata).toBeDefined();
      expect(Object.keys(metadata).length).toBeGreaterThan(0);
      // Check for actual metadata structure
      expect(metadata).toHaveProperty('type');
      expect(metadata.type).toBe('smart-production');
    });
  });

  describe('different tier behaviors', () => {
    const longText = Array(50).fill('This is a sentence.').join(' ');

    it('basic tier should create larger chunks', async () => {
      const basicResult = await chunkerService.chunkDocument(longText, 'basic');
      const premiumResult = await chunkerService.chunkDocument(longText, 'premium');
      
      // Basic tier should have fewer, larger chunks
      expect(basicResult.chunks.length).toBeLessThanOrEqual(premiumResult.chunks.length);
    });
  });
});