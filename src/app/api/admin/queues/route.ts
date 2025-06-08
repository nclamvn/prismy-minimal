import { NextRequest, NextResponse } from 'next/server';
import { translationQueue } from '@/lib/services/queue/translation.queue';

// Basic auth
function requireAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Queue Admin"',
      },
    });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (username !== 'admin' || password !== 'prismy2025') {
    return new NextResponse('Invalid credentials', { status: 401 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authResponse = requireAuth(request);
  if (authResponse) return authResponse;

  try {
    // Get queue info
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      translationQueue.getWaitingCount(),
      translationQueue.getActiveCount(),
      translationQueue.getCompletedCount(),
      translationQueue.getFailedCount(),
      translationQueue.getDelayedCount(),
    ]);

    // Get recent jobs
    const jobs = await translationQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 20);
    
    const jobsData = await Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        status: await job.getState(),
        progress: job.progress,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        completedOn: job.completedOn,
        failedReason: job.failedReason,
      }))
    );

    // Create simple HTML dashboard
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PRISMY Queue Dashboard</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: #333;
          margin-bottom: 30px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
          text-transform: uppercase;
        }
        .stat-card .number {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }
        .jobs-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #666;
        }
        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-waiting { background: #e3f2fd; color: #1976d2; }
        .status-active { background: #fff3e0; color: #f57c00; }
        .status-completed { background: #e8f5e9; color: #388e3c; }
        .status-failed { background: #ffebee; color: #d32f2f; }
        .refresh-btn {
          background: #1976d2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .refresh-btn:hover {
          background: #1565c0;
        }
        .progress {
          width: 100px;
          height: 8px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: #4caf50;
          transition: width 0.3s;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 PRISMY Queue Dashboard</h1>
        
        <div class="stats">
          <div class="stat-card">
            <h3>Waiting</h3>
            <div class="number">${waiting}</div>
          </div>
          <div class="stat-card">
            <h3>Active</h3>
            <div class="number">${active}</div>
          </div>
          <div class="stat-card">
            <h3>Completed</h3>
            <div class="number">${completed}</div>
          </div>
          <div class="stat-card">
            <h3>Failed</h3>
            <div class="number">${failed}</div>
          </div>
          <div class="stat-card">
            <h3>Delayed</h3>
            <div class="number">${delayed}</div>
          </div>
        </div>

        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>

        <div class="jobs-table" style="margin-top: 20px;">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>File</th>
                <th>Progress</th>
                <th>Created</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${jobsData.map(job => `
                <tr>
                  <td>${job.id}</td>
                  <td><span class="status status-${job.status}">${job.status}</span></td>
                  <td>${job.data.fileName || 'N/A'}</td>
                  <td>
                    <div class="progress">
                      <div class="progress-bar" style="width: ${job.progress || 0}%"></div>
                    </div>
                    ${job.progress || 0}%
                  </td>
                  <td>${new Date(job.timestamp).toLocaleString()}</td>
                  <td>${job.failedReason || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <script>
        // Auto refresh every 5 seconds
        setTimeout(() => location.reload(), 5000);
      </script>
    </body>
    </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}