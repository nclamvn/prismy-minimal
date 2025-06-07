import { SmartFixedChunkingStrategy } from './strategies/smart-fixed.strategy'
import { ChunkerService } from './index'

async function testFixed() {
  console.log('🚀 TESTING FIXED SMART CHUNKER\n')
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
  
  // Initial memory
  const initialMem = process.memoryUsage()
  console.log('Initial memory:', {
    heap: Math.round(initialMem.heapUsed / 1024 / 1024) + 'MB',
    rss: Math.round(initialMem.rss / 1024 / 1024) + 'MB'
  })
  
  const testDoc = `
# Technical Documentation

This document demonstrates the fixed chunking system with full DNA extraction.

## Performance Features

The implementation has been optimized to prevent memory leaks:
- Token counting without array creation
- Concurrency-limited DNA extraction
- Efficient caching mechanism
- No unnecessary array allocations

### Code Example

\`\`\`javascript
async function processDocument(text) {
  const chunks = await chunker.chunk(text);
  return chunks.map(c => c.metadata.dna);
}
\`\`\`

## Vietnamese Section

Hệ thống đã được tối ưu hóa để xử lý tiếng Việt hiệu quả.
Không còn vấn đề memory leak khi xử lý văn bản dài.

## Table Example

| Feature | Status |
|---------|--------|
| Memory  | Fixed  |
| Speed   | Fast   |
| DNA     | Full   |

## References

See [1] for chunking algorithms.
Refer to Smith et al., 2023 for benchmarks.
`.trim()

  // Test 1: Strategy
  console.log('\n=== Test 1: Direct Strategy ===')
  const strategy = new SmartFixedChunkingStrategy()
  console.log('Tokenizer:', strategy.getTokenizerType())
  console.log('Tokens:', strategy.countTokens(testDoc))
  
  const start = Date.now()
  const chunks = await strategy.chunk(testDoc, {
    maxTokens: 100,
    overlap: 20,
    preserveStructure: true,
    generateDNA: true
  })
  const elapsed = Date.now() - start
  
  console.log(`\nCompleted in ${elapsed}ms`)
  console.log(`Chunks: ${chunks.length}`)
  
  // Show first chunk with DNA
  if (chunks[0]?.metadata?.dna) {
    const dna = chunks[0].metadata.dna
    console.log('\nFirst chunk DNA:')
    console.log(`- Language: ${dna.language}`)
    console.log(`- Style: ${dna.style}`)
    console.log(`- Complexity: ${dna.complexity}/10`)
    console.log(`- Topics: ${dna.topics.join(', ')}`)
  }
  
  // Test 2: Service with larger document
  console.log('\n\n=== Test 2: Service with Large Doc ===')
  const service = new ChunkerService()
  
  // Create larger document
  const largeDoc = testDoc.repeat(10)
  console.log(`Document size: ${largeDoc.length} chars`)
  
  const serviceStart = Date.now()
  const result = await service.chunkDocument(largeDoc, 'premium', {
    generateDNA: true
  })
  const serviceElapsed = Date.now() - serviceStart
  
  console.log(`\nResults:`)
  console.log(`- Chunks: ${result.chunks.length}`)
  console.log(`- Tokens: ${result.totalTokens}`)
  console.log(`- Time: ${serviceElapsed}ms`)
  console.log(`- Throughput: ${Math.round(largeDoc.length / serviceElapsed * 1000)} chars/sec`)
  
  // Memory after processing
  if (global.gc) {
    global.gc()
  }
  
  const finalMem = process.memoryUsage()
  console.log('\nFinal memory:', {
    heap: Math.round(finalMem.heapUsed / 1024 / 1024) + 'MB',
    rss: Math.round(finalMem.rss / 1024 / 1024) + 'MB'
  })
  
  console.log('\nMemory increase:', {
    heap: Math.round((finalMem.heapUsed - initialMem.heapUsed) / 1024 / 1024) + 'MB',
    rss: Math.round((finalMem.rss - initialMem.rss) / 1024 / 1024) + 'MB'
  })
  
  console.log('\n✅ Test completed successfully!')
}

// Run with expose-gc flag for memory monitoring
testFixed().catch(console.error)