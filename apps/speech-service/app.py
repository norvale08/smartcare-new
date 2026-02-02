from flask import Flask, request, jsonify, send_file
from flask_cors import CORS 
import speech_recognition as sr
import tempfile
import os
import logging
from datetime import datetime
from gtts import gTTS
import io
from functools import lru_cache
import hashlib
import threading

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Global recognizer instance (reused for all requests)
RECOGNIZER = sr.Recognizer()
RECOGNIZER.energy_threshold = 300
RECOGNIZER.dynamic_energy_threshold = True
RECOGNIZER.pause_threshold = 0.8

# Cache for TTS to avoid regenerating same text
@lru_cache(maxsize=100)
def generate_speech_cached(text, language, slow=False, tld='com'):
    """Cache speech synthesis for repeated text with regional variants"""
    tts = gTTS(text=text, lang=language, slow=slow, tld=tld)
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    return audio_buffer.read()

# Warmup function to pre-load services
def warmup_services():
    """Pre-load speech recognition to avoid cold start"""
    try:
        logger.info(" Warming up speech services...")
        
        # Test speech recognition is ready
        logger.info("  → Initializing speech recognizer...")
        test_recognizer = sr.Recognizer()
        
        # Pre-load gTTS for both English and Swahili
        logger.info("  → Pre-loading text-to-speech...")
        dummy_tts_en = gTTS(text="service ready", lang="en", slow=False)
        dummy_tts_sw = gTTS(text="huduma iko tayari", lang="sw", slow=False, tld='co.ke')
        
        logger.info("✓ Speech services warmed up and ready!")
        
    except Exception as e:
        logger.error(f"⚠ Warmup failed: {e}")

# Background warmup starter
def start_warmup():
    """Start warmup in background thread"""
    warmup_thread = threading.Thread(target=warmup_services)
    warmup_thread.daemon = True
    warmup_thread.start()

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    temp_audio_path = None
    try:
        if 'audio' not in request.files:
            logger.error("No audio file in request")
            return jsonify({
                'success': False,
                'error': 'No audio file provided'
            }), 400

        audio_file = request.files['audio']
        language = request.form.get('language', 'en-US')
        
        if audio_file.filename == '':
            logger.error("Empty filename")
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        audio_data_bytes = audio_file.read()
        file_size = len(audio_data_bytes)
        logger.info(f" Received audio: {audio_file.filename}, {file_size} bytes, lang: {language}")

        # Save to temporary file
        temp_audio_path = tempfile.mktemp(suffix='.wav')
        with open(temp_audio_path, 'wb') as f:
            f.write(audio_data_bytes)

        # Use global RECOGNIZER instead of creating new one
        with sr.AudioFile(temp_audio_path) as source:
            logger.info("🎤 Recording audio data...")
            audio_data = RECOGNIZER.record(source)
            
            logger.info(f" Transcribing with Google Speech Recognition...")
            
            try:
                # Use faster recognition without show_all flag
                text = RECOGNIZER.recognize_google(
                    audio_data,
                    language=language
                )
                
                logger.info(f"✓ Transcription successful: '{text}'")
                
                return jsonify({
                    'success': True,
                    'text': text,
                    'language': language
                })
                
            except sr.UnknownValueError:
                logger.warning("⚠ Speech not understood")
                return jsonify({
                    'success': False,
                    'error': 'No clear speech detected. Please speak clearly and try again.'
                }), 400
                
            except sr.RequestError as e:
                logger.error(f" Service error: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': f'Speech recognition service error: {str(e)}'
                }), 500
                    
    except sr.UnknownValueError:
        return jsonify({
            'success': False,
            'error': 'No clear speech detected. Please speak clearly and try again.'
        }), 400
        
    except sr.RequestError as e:
        logger.error(f"Service error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Speech recognition service error: {str(e)}'
        }), 500
        
    except Exception as e:
        logger.error(f" Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Transcription failed: {str(e)}'
        }), 500
        
    finally:
        # Clean up temporary file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
                logger.info("  Cleaned up temp file")
            except Exception as e:
                logger.error(f"⚠ Cleanup error: {str(e)}")

@app.route('/synthesize', methods=['POST'])
def synthesize_speech():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        text = data.get('text', '')
        language = data.get('language', 'en')
        slow = data.get('slow', False)  # Option for slower, clearer speech
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'No text provided for synthesis'
            }), 400
        
        # Determine the best TLD (regional variant) for the language
        # For Swahili, use Kenya domain for more authentic accent
        if language == 'sw':
            tld = 'co.ke'  # Kenya - better for Swahili
            log_lang = 'Swahili (Kenya)'
        elif language == 'en':
            tld = 'com'  # Default English
            log_lang = 'English (US)'
        else:
            tld = 'com'  # Fallback
            log_lang = language
        
        logger.info(f" Synthesizing: '{text[:50]}...' in {log_lang} (slow={slow})")
        
        # Use cached synthesis for repeated text
        audio_data = generate_speech_cached(text, language, slow, tld)
        
        # Create new buffer from cached data
        audio_buffer = io.BytesIO(audio_data)
        
        logger.info("✓ Speech synthesis successful")
        
        return send_file(
            audio_buffer,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        logger.error(f" Synthesis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Speech synthesis failed: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'speech-service',
        'status': 'healthy', 
        'version': '2.2.0',
        'environment': os.environ.get('FLASK_ENV', 'development'),
        'features': ['speech-to-text', 'text-to-speech', 'tts-caching', 'service-warmup', 'regional-variants'],
        'optimizations': [
            'Removed ambient noise adjustment (-0.5s)',
            'TTS caching for repeated text',
            'Optimized file I/O',
            'Global recognizer instance',
            'Background service warmup',
            'Regional voice variants'
        ],
        'supported_languages': {
            'english': 'en-US (transcription), en (synthesis)',
            'swahili': 'sw (transcription & synthesis with Kenya accent)'
        },
        'voice_options': {
            'swahili': {
                'regional_variant': 'Kenya (co.ke)',
                'slow_speech': 'Available via slow parameter'
            },
            'english': {
                'regional_variant': 'US (com)',
                'slow_speech': 'Available via slow parameter'
            }
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'service': 'SmartCare Speech Service',
        'status': 'running',
        'version': '2.2.0',
        'endpoints': {
            'health': '/health',
            'transcribe': '/transcribe (POST)',
            'synthesize': '/synthesize (POST - supports language, slow, regional variants)'
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    environment = os.environ.get('FLASK_ENV', 'development')
    
    logger.info("=" * 60)
    logger.info(" SMARTCARE SPEECH SERVICE")
    logger.info("=" * 60)
    logger.info(f"Environment: {environment}")
    logger.info(f"Port: {port}")
    logger.info(f"Health: http://localhost:{port}/health")
    logger.info(f"Swahili Voice: Kenya accent (co.ke)")
    logger.info("=" * 60)
    
    # Start warmup in background
    start_warmup()
    
    # Use debug mode only in development
    debug_mode = environment == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode, threaded=True)