import { TranslationService } from './translation.service'

async function testTranslation() {
  console.log('🧪 TESTING TRANSLATION SERVICE WITH CHUNKER\n')
  
  const service = new TranslationService()
  
  const testDoc = `
# Technical Documentation

This document demonstrates the integrated translation system.

## Features

The system now includes:
- Automatic document chunking
- Multi-tier translation options
- Context preservation through overlap
- DNA extraction for better translation

## Code Example

\`\`\`javascript
async function translate(text) {
  return await translationService.translateDocument(text, {
    targetLang: 'vi',
    tier: 'premium'
  });
}
\`\`\`

## Conclusion

The integrated system provides high-quality translations while handling documents of any size efficiently.
`.trim()

  // Test each tier
  for (const tier of ['basic', 'standard', 'premium'] as const) {
    console.log(`\n=== Testing ${tier.toUpperCase()} translation ===`)
    
    const start = Date.now()
    
    try {
      const result = await service.translateDocument(testDoc, {
        targetLang: 'vi',
        tier
      })
      
      console.log('✅ Success!')
      console.log(`- Chunks: ${result.metadata.totalChunks}`)
      console.log(`- Tokens: ${result.metadata.totalTokens}`)
      console.log(`- Time: ${result.metadata.processingTime}ms`)
      console.log(`- Preview: "${result.translatedText.substring(0, 100)}..."`)
      
      // Show chunk details for premium
      if (tier === 'premium' && result.chunks.length > 0) {
        const firstChunk = result.chunks[0]
        console.log('\nFirst chunk details:')
        console.log(`- Original tokens: ${firstChunk.originalChunk.tokens}`)
        console.log(`- Model: ${firstChunk.translationMetadata?.model}`)
        console.log(`- Confidence: ${firstChunk.translationMetadata?.confidence}`)
        
        if (firstChunk.originalChunk.metadata?.dna) {
          console.log(`- DNA:`, firstChunk.originalChunk.metadata.dna)
        }
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message)
    }
  }
  
  console.log('\n✅ All tests completed!')
}

testTranslation().catch(console.error)