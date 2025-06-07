import { SmartProductionStrategy } from './strategies/smart-production.strategy'

async function testProduction() {
  console.log('🚀 TESTING PRODUCTION SMART CHUNKER WITH DEBUG\n')
  
  const testDoc = `
# Test Document

This is a test paragraph to verify the production chunker works correctly without memory leaks.

## Technical Section

The chunker now includes:
- Proper validation of maxTokens
- Token counting without array creation
- Concurrency-limited DNA extraction
- Infinite loop prevention

### Code Example

\`\`\`javascript
function test() {
  return "Memory safe!";
}
\`\`\`

## Vietnamese Test

Hệ thống chunking đã được tối ưu hóa hoàn toàn để xử lý mọi ngôn ngữ.
`.trim()

  const strategy = new SmartProductionStrategy()
  
  console.log('Document tokens:', strategy.countTokens(testDoc))
  console.log('Tokenizer type:', strategy.getTokenizerType())
  
  // Test with debug enabled
  const chunks = await strategy.chunk(testDoc, {
    maxTokens: 100,
    overlap: 20,
    preserveStructure: true,
    generateDNA: true,
    debug: true // Enable debug logging
  })
  
  console.log(`\n✅ Success! Created ${chunks.length} chunks`)
  
  // Show results
  chunks.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1}:`)
    console.log(`- ID: ${chunk.id}`)
    console.log(`- Tokens: ${chunk.tokens}`)
    console.log(`- Content length: ${chunk.content.length} chars`)
    if (chunk.metadata?.dna) {
      console.log(`- DNA:`, chunk.metadata.dna)
    }
  })
  
  // Final memory
  const mem = process.memoryUsage()
  console.log(`\nFinal memory: Heap ${Math.round(mem.heapUsed / 1024 / 1024)}MB`)
}

testProduction().catch(console.error)