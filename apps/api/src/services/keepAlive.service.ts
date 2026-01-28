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
    
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
    
    } else {
      console.warn('  Python service responded with status:', response.status);
    }
  } catch (error) {
    console.error(' Failed to ping Python service:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Start the keep-alive service
 * Only runs in production to prevent spin-down on Render free tier
 */
export function startKeepAliveService() {
  // Only enable in production
  if (process.env.NODE_ENV !== 'production') {
   
    return;
  }

  // Don't start if already running
  if (keepAliveInterval) {
   
    return;
  }

 
  // Ping immediately on startup
  pingPythonService();

  // Then ping every 14 minutes
  keepAliveInterval = setInterval(pingPythonService, PING_INTERVAL);
}


  //Stop the keep-alive service (for graceful shutdown)
 
export function stopKeepAliveService() {
  if (keepAliveInterval) {
    
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Export for manual testing
export { pingPythonService };