// FILE: apps/api/src/services/keepAlive.service.ts
import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'https://smartcare-speech-service.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (before Render's 15-minute timeout)

let keepAliveInterval: NodeJS.Timeout | null = null;

/**
 * Ping the Python speech service to keep it alive (prevent Render spin-down)
 */
async function pingPythonService() {
  try {
    console.log('🏓 Pinging Python speech service to keep alive...');
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      console.log('✅ Python service is alive');
    } else {
      console.warn('⚠️  Python service responded with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to ping Python service:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Start the keep-alive service
 * Only runs in production to prevent spin-down on Render free tier
 */
export function startKeepAliveService() {
  // Only enable in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏭️  Keep-alive service disabled in development');
    return;
  }

  // Don't start if already running
  if (keepAliveInterval) {
    console.log('⚠️  Keep-alive service already running');
    return;
  }

  console.log('🚀 Starting keep-alive service for Python speech service');
  console.log(`📍 Target: ${PYTHON_SERVICE_URL}`);
  console.log(`⏱️  Interval: ${PING_INTERVAL / 60000} minutes`);

  // Ping immediately on startup
  pingPythonService();

  // Then ping every 14 minutes
  keepAliveInterval = setInterval(pingPythonService, PING_INTERVAL);
}

/**
 * Stop the keep-alive service (for graceful shutdown)
 */
export function stopKeepAliveService() {
  if (keepAliveInterval) {
    console.log('🛑 Stopping keep-alive service');
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Export for manual testing
export { pingPythonService };