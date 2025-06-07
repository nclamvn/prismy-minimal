import { SimpleChunkingStrategy } from './strategies/simple.strategy'

async function testChunker() {
  const strategy = new SimpleChunkingStrategy()
  
  const testText = `This is a test document with multiple paragraphs.
  
  The second paragraph contains more information about the topic.
  It spans multiple lines and has various sentences.
  
  The third paragraph is shorter but still important.`
  
  const chunks = await strategy.chunk(testText, {
    maxTokens: 50,
    overlap: 10,
    preserveStructure: true,
    generateDNA: true
  })
  
  console.log('Chunks generated:', chunks.length)
  chunks.forEach((chunk, index) => {
    console.log(`\nChunk ${index + 1}:`)
    console.log('- ID:', chunk.id)
    console.log('- Tokens:', chunk.tokens)
    console.log('- Content preview:', chunk.content.substring(0, 50) + '...')
    console.log('- DNA:', chunk.metadata?.dna)
  })
}

// Run test
testChunker()