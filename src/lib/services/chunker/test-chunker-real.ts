import { ChunkerService } from './index'

async function testRealDocument() {
  console.log('📄 REAL DOCUMENT CHUNKING TEST\n')
  
  const chunkerService = new ChunkerService()
  
  // Test với document size khác nhau
  const documents = {
    small: `
# Introduction

This is a small document to test basic chunking functionality. It contains a few paragraphs and sections.

## Main Content

The chunking system should handle this document as a single chunk since it's quite short.

## Conclusion

This concludes our small test document.
    `.trim(),
    
    medium: `
# Technical Documentation

This document explains the architecture of our translation system.

## Overview

Our translation platform uses advanced AI models to provide high-quality translations across multiple languages. The system is designed with scalability and accuracy in mind.

### Key Features

1. **Multi-language Support**: We support over 50 languages with native-level accuracy.
2. **Context Preservation**: Our chunking algorithm maintains context across segments.
3. **Format Retention**: Documents maintain their original formatting.

## Architecture

### Core Components

The system consists of several key components:

#### Parser Service
Handles document parsing for various formats including PDF, DOCX, and plain text. The parser extracts content while preserving structure.

#### Chunking Engine
Our smart chunking engine divides documents into optimal segments for translation. It considers:
- Semantic boundaries
- Token limits
- Context preservation
- Language-specific requirements

#### Translation Pipeline
The translation pipeline processes chunks through multiple stages:
1. Pre-processing and normalization
2. Translation using AI models
3. Post-processing and quality checks
4. Format reconstruction

### Implementation Details

\`\`\`javascript
class TranslationService {
  async translate(document, options) {
    const chunks = await this.chunker.chunk(document);
    const translations = await Promise.all(
      chunks.map(chunk => this.translateChunk(chunk))
    );
    return this.assembleDocument(translations);
  }
}
\`\`\`

## Performance Considerations

The system is optimized for both speed and quality. Key optimizations include:
- Parallel chunk processing
- Intelligent caching
- Adaptive chunk sizing
- Resource pooling

## Conclusion

This architecture provides a robust foundation for high-quality document translation.
    `.trim(),
    
    vietnamese: `
# Hướng dẫn sử dụng hệ thống

Tài liệu này hướng dẫn cách sử dụng hệ thống dịch thuật AI.

## Giới thiệu

Hệ thống dịch thuật của chúng tôi sử dụng công nghệ AI tiên tiến để cung cấp bản dịch chất lượng cao. Hệ thống hỗ trợ nhiều ngôn ngữ và định dạng tài liệu khác nhau.

### Tính năng chính

- Dịch đa ngôn ngữ với độ chính xác cao
- Giữ nguyên format và cấu trúc tài liệu
- Xử lý nhanh với công nghệ chunking thông minh
- Hỗ trợ nhiều định dạng file

## Cách sử dụng

### Bước 1: Tải lên tài liệu

Người dùng có thể tải lên tài liệu bằng cách:
1. Kéo thả file vào khu vực upload
2. Click vào nút tải lên và chọn file
3. Paste nội dung trực tiếp

### Bước 2: Chọn ngôn ngữ đích

Hệ thống tự động nhận diện ngôn ngữ nguồn. Bạn chỉ cần chọn ngôn ngữ muốn dịch sang.

### Bước 3: Xử lý và tải xuống

Sau khi dịch xong, bạn có thể:
- Xem trước kết quả
- Tải xuống file đã dịch
- Copy nội dung

## Lưu ý quan trọng

- File không được vượt quá 10MB
- Định dạng phức tạp có thể mất thời gian xử lý lâu hơn
- Nên kiểm tra lại kết quả với tài liệu chuyên ngành
    `.trim()
  }
  
  // Test each document
  for (const [type, content] of Object.entries(documents)) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing ${type.toUpperCase()} document (${content.length} chars)`)
    console.log('='.repeat(60))
    
    // Analyze first
    const analysis = await chunkerService.analyzeDocument(content)
    console.log('\n📊 Analysis:')
    console.log(`- Estimated tokens: ${analysis.estimatedTokens}`)
    console.log(`- Recommended tier: ${analysis.recommendedTier}`)
    console.log(`- Estimated chunks: B:${analysis.estimatedChunks.basic} / S:${analysis.estimatedChunks.standard} / P:${analysis.estimatedChunks.premium}`)
    
    // Test recommended tier
    const tier = analysis.recommendedTier
    console.log(`\n🔧 Chunking with ${tier} tier...`)
    
    const result = await chunkerService.chunkDocument(content, tier, {
      generateDNA: true // Enable DNA for testing
    })
    
    console.log(`\n✅ Results:`)
    console.log(`- Chunks created: ${result.chunks.length}`)
    console.log(`- Total tokens: ${result.totalTokens}`)
    console.log(`- Processing time: ${result.metadata.processingTime}ms`)
    
    // Show chunk details
    if (result.chunks.length > 0) {
      console.log('\n📦 Chunk Details:')
      result.chunks.forEach((chunk, idx) => {
        console.log(`\nChunk ${idx + 1}:`)
        console.log(`- Tokens: ${chunk.tokens}`)
        console.log(`- Length: ${chunk.content.length} chars`)
        
        if (chunk.metadata?.dna) {
          const dna = chunk.metadata.dna
          console.log(`- Language: ${dna.language}`)
          console.log(`- Style: ${dna.style}`)
          console.log(`- Complexity: ${dna.complexity}/10`)
          if (dna.hasCode) console.log('- Contains code: Yes')
          if (dna.topics.length > 0) {
            console.log(`- Topics: ${dna.topics.slice(0, 3).join(', ')}`)
          }
        }
        
        console.log(`- Preview: "${chunk.content.substring(0, 60)}..."`)
      })
    }
  }
  
  // Test error handling
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('ERROR HANDLING TEST')
  console.log('='.repeat(60))
  
  try {
    await chunkerService.chunkDocument('', 'standard')
  } catch (error) {
    console.log('✅ Empty text handled correctly:', error.message)
  }
  
  // Performance test
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('PERFORMANCE TEST')
  console.log('='.repeat(60))
  
  const largeDoc = documents.medium.repeat(10) // ~10x medium doc
  console.log(`\nTesting large document (${largeDoc.length} chars)...`)
  
  const startTime = Date.now()
  const perfResult = await chunkerService.chunkDocument(largeDoc, 'standard')
  const totalTime = Date.now() - startTime
  
  console.log(`✅ Performance Results:`)
  console.log(`- Document size: ${largeDoc.length} chars`)
  console.log(`- Chunks created: ${perfResult.chunks.length}`)
  console.log(`- Total tokens: ${perfResult.totalTokens}`)
  console.log(`- Total time: ${totalTime}ms`)
  console.log(`- Throughput: ${Math.round(largeDoc.length / totalTime * 1000)} chars/sec`)
  
  console.log('\n🎉 All tests completed successfully!')
}

testRealDocument().catch(console.error)