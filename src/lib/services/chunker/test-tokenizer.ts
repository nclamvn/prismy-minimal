import { SmartChunkingStrategy } from './strategies/smart.strategy'

async function testTokenizer() {
  const strategy = new SmartChunkingStrategy()
  
  const testTexts = [
    "Hello world",
    "This is a longer sentence with more tokens.",
    "Đây là văn bản tiếng Việt để test tokenizer.",
    "複雑な日本語のテキスト。",
    "Code example: const x = 42; function test() { return x * 2; }"
  ]
  
  console.log('Tokenizer Type:', strategy.getTokenizerType())
  console.log('\nToken Count Tests:')
  console.log('-'.repeat(50))
  
  for (const text of testTexts) {
    const tokens = strategy.countTokens(text)
    const ratio = tokens / text.length
    console.log(`Text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`)
    console.log(`Length: ${text.length} chars | Tokens: ${tokens} | Ratio: ${ratio.toFixed(2)}`)
    console.log('-'.repeat(50))
  }
  
  // Test chunking với real tokenizer
  const longText = `
# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

## Types of Machine Learning

1. Supervised Learning
2. Unsupervised Learning
3. Reinforcement Learning

Each type has its own applications and use cases in the real world.
  `.trim()
  
  console.log('\nChunking Test with GPT Tokenizer:')
  const chunks = await strategy.chunk(longText, {
    maxTokens: 50,
    overlap: 10,
    preserveStructure: true,
    generateDNA: false
  })
  
  console.log(`Total chunks: ${chunks.length}`)
  chunks.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1}:`)
    console.log(`- Tokens: ${chunk.tokens}`)
    console.log(`- Content: "${chunk.content.substring(0, 50)}..."`)
  })
}

testTokenizer()