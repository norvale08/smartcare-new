"""Gunicorn configuration file for Render deployment"""
import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
backlog = 2048

# Worker processes
workers = 2  # For free tier, keep low
worker_class = 'sync'
worker_connections = 1000
threads = 2  # Threads per worker for better I/O handling
timeout = 120  # 120 seconds (crucial for speech recognition)
keepalive = 5

# Request handling
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'smartcare-speech-service'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Use RAM for worker heartbeat (better for containers)
worker_tmp_dir = '/dev/shm'

# Restart workers after this many requests to prevent memory leaks
max_requests = 100
max_requests_jitter = 10

# Graceful timeout
graceful_timeout = 30

# Pre-load the application for faster worker spawn
preload_app = False  # Set to False to avoid import issues

def on_starting(server):
    """Called just before the master process is initialized."""
    print("=" * 60)
    print("🚀 Starting SmartCare Speech Service")
    print("=" * 60)
    print(f"Workers: {workers}")
    print(f"Threads per worker: {threads}")
    print(f"Timeout: {timeout}s")
    print(f"Port: {os.environ.get('PORT', '10000')}")
    print("=" * 60)

def on_reload(server):
    """Called on worker reload."""
    print("🔄 Reloading workers...")

def worker_int(worker):
    """Called when a worker receives SIGINT/SIGTERM."""
    print(f"⚠️  Worker {worker.pid} received interrupt signal")

def worker_abort(worker):
    """Called when worker receives SIGABRT (usually on timeout)."""
    print(f"❌ Worker {worker.pid} timed out - aborting")