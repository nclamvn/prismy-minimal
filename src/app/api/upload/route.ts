import { NextRequest, NextResponse } from 'next/server'
import { parseFile, getFileInfo } from '@/lib/parsers'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
 try {
   const formData = await request.formData()
   const file = formData.get('file') as File
   
   if (!file) {
     return NextResponse.json({ error: 'No file provided' }, { status: 400 })
   }

   // Check file size (10MB limit)
   if (file.size > 10 * 1024 * 1024) {
     return NextResponse.json({ error: 'File size exceeds 10MB' }, { status: 400 })
   }

   // Get file info
   const fileInfo = getFileInfo(file)
   
   // Check supported types
   const supportedTypes = ['DOCX', 'DOC', 'TXT', 'PDF']
   if (!supportedTypes.includes(fileInfo.type)) {
     return NextResponse.json({ 
       error: `Unsupported file type: ${fileInfo.type}`,
       details: `We currently support: ${supportedTypes.join(', ')}`,
       fileName: fileInfo.name
     }, { status: 400 })
   }

   // Parse file content
   let text = ''
   try {
     console.log('File info:', fileInfo);
     console.log('File name:', file.name);
     console.log('File size:', file.size);
     console.log('File type detected:', fileInfo.type);
     
     // Nếu là PDF, queue để xử lý
     if (fileInfo.type === 'PDF') {
       const { extractionQueue } = await import('@/lib/services/queue/extraction-queue.service');
       
       const fileId = nanoid();
       const fileBuffer = Buffer.from(await file.arrayBuffer()).toString('base64');
       
       const job = await extractionQueue.add('extract-pdf', {
         fileBuffer,
         fileName: file.name,
         fileId
       });
       
       console.log('PDF queued for extraction:', job.id);
       
       return NextResponse.json({
         success: true,
         queued: true,
         jobId: job.id,
         fileId,
         fileName: fileInfo.name,
         fileSize: fileInfo.size,
         fileSizeFormatted: fileInfo.sizeFormatted,
         fileType: fileInfo.type,
         message: 'PDF queued for extraction. Use jobId to check status.'
       });
     }
     
     // Các file khác parse trực tiếp
     text = await parseFile(file)
     
     console.log('Parse success, text length:', text.length);
     console.log('First 100 chars:', text.substring(0, 100));
     
     // Clean up text
     text = text.trim()
     
     // Check if text is empty
     if (!text) {
       return NextResponse.json({ 
         error: 'File appears to be empty',
         details: 'Could not extract any text from the file',
         fileName: fileInfo.name
       }, { status: 400 })
     }
     
     // Limit text length for demo (optional)
     const maxLength = 50000 // ~10 pages
     if (text.length > maxLength) {
       text = text.substring(0, maxLength) + '\n\n[Text truncated due to length]'
     }
     
   } catch (parseError: any) {
     console.error('Parse error full:', parseError);
     console.error('Parse error stack:', parseError.stack);
     return NextResponse.json({ 
       error: `Failed to parse ${fileInfo.type} file`,
       details: parseError.message,
       fileName: fileInfo.name,
       stack: parseError.stack
     }, { status: 400 })
   }

   return NextResponse.json({
     success: true,
     fileName: fileInfo.name,
     fileSize: fileInfo.size,
     fileSizeFormatted: fileInfo.sizeFormatted,
     fileType: fileInfo.type,
     textLength: text.length,
     text: text
   })
   
 } catch (error: any) {
   console.error('Upload error:', error)
   return NextResponse.json(
     { error: 'Upload failed', details: error.message },
     { status: 500 }
   )
 }
}

export const config = {
 api: {
   bodyParser: false,
 },
}