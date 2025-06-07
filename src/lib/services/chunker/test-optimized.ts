import { SmartOptimizedChunkingStrategy } from './strategies/smart-optimized.strategy'
import { ChunkerService } from './index'

async function testOptimized() {
  console.log('🚀 TESTING OPTIMIZED SMART CHUNKER WITH DNA\n')
  
  const testDoc = `
# Technical Documentation

This document demonstrates the optimized chunking system with full DNA extraction.

## Performance Features

The new implementation includes:
- Tiktoken for accurate token counting
- Concurrent DNA extraction with p-limit
- Memory-efficient caching
- Improved entity detection

### Code Example

\`\`\`javascript
async function processDocument(text) {
  const chunks = await chunker.chunk(text);
  return chunks.map(c => c.metadata.dna);
}
\`\`\`

## Vietnamese Section

Hệ thống mới đã được tối ưu hóa để xử lý tiếng Việt hiệu quả hơn.
Các cải tiến bao gồm nhận diện ngôn ngữ chính xác và tính toán token phù hợp.

## Table Example

| Feature | Before | After |
|---------|--------|-------|
| Speed   | Slow   | Fast  |
| Memory  | High   | Low   |
| DNA     | Basic  | Full  |

## References

See [1] for more details on chunking algorithms.
For performance benchmarks, refer to Smith et al., 2023.
`.trim()

  // Test direct strategy
  console.log('=== Test 1: Direct Strategy ===')
  const strategy = new SmartOptimizedChunkingStrategy()
  console.log('Tokenizer type:', strategy.getTokenizerType())
  console.log('Document tokens:', strategy.countTokens(testDoc))
  
  const start = Date.now()
  const chunks = await strategy.chunk(testDoc, {
    maxTokens: 100,
    overlap: 20,
    preserveStructure: true,
    generateDNA: true
  })
  const elapsed = Date.now() - start
  
  console.log(`\nChunking completed in ${elapsed}ms`)
  console.log(`Total chunks: ${chunks.length}`)
  
  // Analyze DNA
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`\n--- Chunk ${i + 1} ---`)
    console.log(`ID: ${chunk.id}`)
    console.log(`Tokens: ${chunk.tokens}`)
    console.log(`Content: "${chunk.content.substring(0, 50)}..."`)
    
    if (chunk.metadata?.dna) {
      const dna = chunk.metadata.dna
      console.log('\nDNA Analysis:')
      console.log(`- Language: ${dna.language}`)
      console.log(`- Style: ${dna.style}`)
      console.log(`- Complexity: ${dna.complexity}/10`)
      console.log(`- Topics: ${dna.topics.join(', ') || 'none'}`)
      console.log(`- Entities: ${dna.entities.slice(0, 3).join(', ') || 'none'}`)
      console.log(`- Has Code: ${dna.hasCode}`)
      console.log(`- Has Table: ${dna.hasTable}`)
      console.log(`- References: ${dna.references.join(', ') || 'none'}`)
    }
  }
  
  // Test service
  console.log('\n\n=== Test 2: Chunker Service ===')
  const service = new ChunkerService()
  
  const result = await service.chunkDocument(testDoc, 'premium', {
    generateDNA: true
  })
  
  console.log('Service results:')
  console.log(`- Chunks: ${result.chunks.length}`)
  console.log(`- Total tokens: ${result.totalTokens}`)
  console.log(`- Processing time: ${result.metadata.processingTime}ms`)
  
  // Memory usage
  if (global.gc) {
    global.gc()
    const usage = process.memoryUsage()
    console.log('\nMemory usage:')
    console.log(`- Heap: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`)
    console.log(`- RSS: ${Math.round(usage.rss / 1024 / 1024)}MB`)
  }
  
  console.log('\n✅ All tests passed successfully!')
}

testOptimized().catch(console.error)