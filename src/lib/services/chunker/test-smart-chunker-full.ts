import { SmartChunkingStrategy } from './strategies/smart.strategy'
import { ChunkerService } from './index'

async function testFullChunking() {
  console.log('🧪 FULL SMART CHUNKER TEST\n')
  
  // Test 1: Multi-language document
  const multiLangDoc = `
# Introduction to AI Translation

Artificial Intelligence has revolutionized the way we handle multilingual communication.

## English Section

This section demonstrates how the chunker handles English text with various complexities.

### Technical Details

The implementation uses advanced NLP techniques:
- Tokenization with GPT-3 encoder
- Context-aware chunking
- DNA extraction for metadata

\`\`\`javascript
function translate(text, targetLang) {
  const tokens = tokenize(text);
  return processTokens(tokens, targetLang);
}
\`\`\`

## Vietnamese Section - Phần Tiếng Việt

Công nghệ AI đã thay đổi cách chúng ta xử lý dịch thuật. Hệ thống chunking thông minh có thể:
- Nhận diện ngôn ngữ tự động
- Tách văn bản theo ngữ cảnh
- Bảo toàn cấu trúc tài liệu

### Ví dụ Thực Tế

Khi dịch tài liệu kỹ thuật, việc giữ nguyên format và context là rất quan trọng.

## Mixed Language Example

Sometimes we need to handle 混合语言 (mixed languages) trong cùng một document. 
This is particularly challenging for tokenization.

## Conclusion

The smart chunking system handles multiple languages efficiently while preserving document structure.
`.trim()

  // Test với SmartChunkingStrategy trực tiếp
  console.log('=== Test 1: SmartChunkingStrategy Direct ===')
  const smartChunker = new SmartChunkingStrategy()
  
  const chunks = await smartChunker.chunk(multiLangDoc, {
    maxTokens: 100,
    overlap: 20,
    preserveStructure: true,
    generateDNA: true
  })
  
  console.log(`Total chunks: ${chunks.length}`)
  console.log(`Document tokens: ${smartChunker.countTokens(multiLangDoc)}`)
  
  // Analyze chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`\n--- Chunk ${i + 1} ---`)
    console.log(`ID: ${chunk.id.substring(0, 16)}...`)
    console.log(`Tokens: ${chunk.tokens}`)
    console.log(`Content: "${chunk.content.substring(0, 60)}..."`)
    
    if (chunk.metadata?.dna) {
      const dna = chunk.metadata.dna
      console.log(`Language: ${dna.language}`)
      console.log(`Style: ${dna.style}`)
      console.log(`Complexity: ${dna.complexity}/10`)
      console.log(`Topics: ${dna.topics.slice(0, 3).join(', ')}`)
      console.log(`Has Code: ${dna.hasCode}`)
    }
    
    console.log(`Links: prev=${chunk.metadata?.prevChunkId?.substring(0, 8) || 'none'}, next=${chunk.metadata?.nextChunkId?.substring(0, 8) || 'none'}`)
  }
  
  // Test 2: Using ChunkerService
  console.log('\n\n=== Test 2: ChunkerService with Tiers ===')
  const chunkerService = new ChunkerService()
  
  // Analyze document first
  const analysis = await chunkerService.analyzeDocument(multiLangDoc)
  console.log('Document Analysis:')
  console.log(`- Estimated tokens: ${analysis.estimatedTokens}`)
  console.log(`- Estimated chunks:`)
  console.log(`  - Basic: ${analysis.estimatedChunks.basic}`)
  console.log(`  - Standard: ${analysis.estimatedChunks.standard}`)
  console.log(`  - Premium: ${analysis.estimatedChunks.premium}`)
  console.log(`- Recommended tier: ${analysis.recommendedTier}`)
  
  // Test each tier
  for (const tier of ['basic', 'standard', 'premium'] as const) {
    console.log(`\n--- Testing ${tier.toUpperCase()} tier ---`)
    const tierInfo = chunkerService.getTierInfo(tier)
    console.log(`Description: ${tierInfo.description}`)
    
    const result = await chunkerService.chunkDocument(multiLangDoc, tier)
    console.log(`Chunks: ${result.chunks.length}`)
    console.log(`Total tokens: ${result.totalTokens}`)
    console.log(`Processing time: ${result.metadata.processingTime}ms`)
    
    // Show first chunk
    if (result.chunks.length > 0) {
      const firstChunk = result.chunks[0]
      console.log(`First chunk preview: "${firstChunk.content.substring(0, 50)}..."`)
    }
  }
  
  // Test 3: Edge cases
  console.log('\n\n=== Test 3: Edge Cases ===')
  
  // Empty text
  try {
    await chunkerService.chunkDocument('', 'standard')
  } catch (error) {
    console.log('✅ Empty text handled:', error.message)
  }
  
  // Very short text
  const shortText = 'Hello world!'
  const shortResult = await chunkerService.chunkDocument(shortText, 'standard')
  console.log(`✅ Short text (${shortText.length} chars) → ${shortResult.chunks.length} chunk`)
  
  // Unicode heavy text
  const unicodeText = '🚀 Emoji test 你好世界 こんにちは 🎉'
  const unicodeResult = await chunkerService.chunkDocument(unicodeText, 'standard')
  console.log(`✅ Unicode text → ${unicodeResult.chunks.length} chunk, ${unicodeResult.totalTokens} tokens`)
}

// Run tests
testFullChunking().catch(console.error)