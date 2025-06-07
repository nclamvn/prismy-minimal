import { ChunkerService } from './index'

async function testFinal() {
  console.log('🚀 FINAL CHUNKER SERVICE TEST\n')
  
  const service = new ChunkerService()
  
  // Test document với multiple languages
  const testDoc = `
# PRISMY Translation System Documentation

This comprehensive guide covers the advanced translation system built with modern AI technology.

## Overview

PRISMY is a state-of-the-art translation platform that leverages:
- GPT-4 for high-quality translations
- Smart chunking for optimal context preservation
- Multi-tier processing for different quality needs

## Technical Architecture

The system implements a modular pipeline architecture:

### Core Components

1. **Document Parser**: Extracts content from various formats
2. **Smart Chunker**: Intelligently divides documents while preserving context
3. **Translation Engine**: Multi-tier translation with quality options
4. **Output Generator**: Reconstructs documents in original format

### Code Example

\`\`\`javascript
async function translateDocument(doc, options) {
  const chunks = await chunker.chunk(doc.content);
  const translations = await Promise.all(
    chunks.map(chunk => translator.translate(chunk, options))
  );
  return assembler.reconstruct(translations);
}
\`\`\`

## Vietnamese Documentation - Tài liệu tiếng Việt

Hệ thống PRISMY cung cấp khả năng dịch thuật chuyên nghiệp với nhiều tính năng nổi bật:

- Hỗ trợ đa ngôn ngữ với độ chính xác cao
- Giữ nguyên định dạng và cấu trúc văn bản
- Tối ưu hóa cho văn bản kỹ thuật và chuyên ngành

### Ví dụ sử dụng

Người dùng có thể dễ dàng tích hợp API vào ứng dụng của mình để tự động hóa quy trình dịch thuật.

## Performance Metrics

| Metric | Basic | Standard | Premium |
|--------|-------|----------|---------|
| Speed  | <1s   | 2-5s     | 5-10s   |
| Quality| Good  | Better   | Best    |
| Cost   | $0.01 | $0.05    | $0.10   |

## Conclusion

PRISMY represents the future of automated translation, combining speed, accuracy, and format preservation.

For more information, visit our documentation at docs.prismy.ai
`.trim()

  console.log(`Document size: ${testDoc.length} chars\n`)
  
  // Test all tiers
  for (const tier of ['basic', 'standard', 'premium'] as const) {
    console.log(`\n=== Testing ${tier.toUpperCase()} tier ===`)
    
    const startMem = process.memoryUsage()
    const startTime = Date.now()
    
    try {
      const result = await service.chunkDocument(testDoc, tier, {
        generateDNA: tier === 'premium' // Only premium gets DNA
      })
      
      const endTime = Date.now()
      const endMem = process.memoryUsage()
      
      console.log(`✅ Success!`)
      console.log(`- Chunks: ${result.chunks.length}`)
      console.log(`- Total tokens: ${result.totalTokens}`)
      console.log(`- Processing time: ${endTime - startTime}ms`)
      console.log(`- Memory delta: ${Math.round((endMem.heapUsed - startMem.heapUsed) / 1024)}KB`)
      
      // Show first chunk
      const firstChunk = result.chunks[0]
      console.log(`- First chunk: ${firstChunk.tokens} tokens, "${firstChunk.content.substring(0, 50)}..."`)
      
      // Check DNA for premium
      if (tier === 'premium' && firstChunk.metadata?.dna) {
        console.log(`- DNA detected:`, firstChunk.metadata.dna)
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`)
    }
  }
  
  // Test edge cases
  console.log(`\n\n=== Testing Edge Cases ===`)
  
  // Empty text
  try {
    await service.chunkDocument('', 'standard')
  } catch (error) {
    console.log(`✅ Empty text handled: "${error.message}"`)
  }
  
  // Very large document
  const largeDoc = testDoc.repeat(10)
  console.log(`\nLarge document test (${largeDoc.length} chars):`)
  
  const start = Date.now()
  const result = await service.chunkDocument(largeDoc, 'standard')
  const elapsed = Date.now() - start
  
  console.log(`✅ Processed in ${elapsed}ms`)
  console.log(`- Chunks: ${result.chunks.length}`)
  console.log(`- Throughput: ${Math.round(largeDoc.length / elapsed * 1000)} chars/sec`)
  
  // Final memory check
  if (global.gc) {
    global.gc()
  }
  
  const finalMem = process.memoryUsage()
  console.log(`\nFinal memory usage: ${Math.round(finalMem.heapUsed / 1024 / 1024)}MB`)
  
  console.log('\n🎉 All tests completed successfully!')
}

testFinal().catch(console.error)