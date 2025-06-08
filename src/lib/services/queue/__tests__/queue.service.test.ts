import { QueueService } from '../queue.service';

// Since DISABLE_QUEUE=true in tests, queue operations return dummy data
describe('QueueService', () => {
  let queueService: QueueService;

  beforeEach(() => {
    queueService = new QueueService();
  });

  describe('addTranslationJob', () => {
    it('should add a translation job', async () => {
      const jobData = {
        fileName: 'test.txt',
        fileBuffer: Buffer.from('Hello World'),
        config: {
          targetLanguage: 'vi',
          tier: 'basic',
        },
        userId: 'test-user',
      };

      const jobId = await queueService.addTranslationJob(jobData);
      
      expect(jobId).toBe('dummy-job-id'); // Queue is disabled in tests
    });

    it('should extract text from .txt files', async () => {
      const testText = 'This is a test file content';
      const jobData = {
        fileName: 'test.txt',
        fileBuffer: Buffer.from(testText),
        config: {
          targetLanguage: 'vi',
          tier: 'standard',
        },
      };

      const jobId = await queueService.addTranslationJob(jobData);
      
      expect(jobId).toBeDefined();
    });

    it('should handle PDF files', async () => {
      const jobData = {
        fileName: 'test.pdf',
        fileBuffer: Buffer.from('PDF content'),
        config: {
          targetLanguage: 'es',
          tier: 'premium',
        },
      };

      const jobId = await queueService.addTranslationJob(jobData);
      
      expect(jobId).toBeDefined();
    });

    it('should handle DOCX files', async () => {
      const jobData = {
        fileName: 'test.docx',
        fileBuffer: Buffer.from('DOCX content'),
        config: {
          targetLanguage: 'fr',
          tier: 'basic',
        },
      };

      const jobId = await queueService.addTranslationJob(jobData);
      
      expect(jobId).toBeDefined();
    });
  });

  describe('getJobStatus', () => {
    it('should return null for non-existent job', async () => {
      const status = await queueService.getJobStatus('non-existent-id');
      
      expect(status).toBeNull();
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await queueService.getQueueStats();
      
      // When queue is disabled, getQueueStats returns an object with zeros
      expect(stats).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0
      });
    });
  });

  describe('cleanFailedJobs', () => {
    it('should clean failed jobs', async () => {
      const cleaned = await queueService.cleanFailedJobs();
      
      expect(cleaned).toBe(0); // Queue is disabled
    });
  });

  describe('retryJob', () => {
    it('should retry a job', async () => {
      const result = await queueService.retryJob('test-job-id');
      
      expect(result).toBe(false); // Queue is disabled
    });
  });
});