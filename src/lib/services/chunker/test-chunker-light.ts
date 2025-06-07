import { SmartChunkingStrategy } from './strategies/smart.strategy'
import { ChunkerService } from './index'

async function testLightweight() {
  console.log('🧪 LIGHTWEIGHT CHUNKER TEST\n')
  
  // Test with smaller document
  const testDoc = `
# Test Document

This is a test paragraph with some content to verify chunking works correctly.

## Section Two

Another paragraph here with different content to test section detection.
`.trim()

  console.log('Document length:', testDoc.length, 'chars')
  
  // Test 1: Direct strategy
  console.log('\n=== Test 1: Smart Strategy ===')
  const strategy = new SmartChunkingStrategy()
  console.log('Token count:', strategy.countTokens(testDoc))
  
  const chunks = await strategy.chunk(testDoc, {
    maxTokens: 50,
    overlap: 10,
    preserveStructure: true,
    generateDNA: false // Skip DNA for now
  })
  
  console.log('Chunks created:', chunks.length)
  chunks.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1}:`)
    console.log('- Tokens:', chunk.tokens)
    console.log('- Length:', chunk.content.length, 'chars')
    console.log('- Preview:', chunk.content.substring(0, 50) + '...')
  })
  
  // Test 2: Service
  console.log('\n\n=== Test 2: Chunker Service ===')
  const service = new ChunkerService()
  
  const result = await service.chunkDocument(testDoc, 'standard')
  console.log('Service result:')
  console.log('- Chunks:', result.chunks.length)
  console.log('- Total tokens:', result.totalTokens)
  console.log('- Processing time:', result.metadata.processingTime, 'ms')
  
  console.log('\n✅ Test completed successfully!')
}

testLightweight().catch(console.error)