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

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # REQUIRED: Enable CORS for frontend requests

# Cache for TTS to avoid regenerating same text
@lru_cache(maxsize=100)
def generate_speech_cached(text, language):
    """Cache speech synthesis for repeated text"""
    tts = gTTS(text=text, lang=language, slow=False)
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    return audio_buffer.read()

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
        logger.info(f"📁 Received audio: {audio_file.filename}, {file_size} bytes, lang: {language}")

        # Save to temporary file
        temp_audio_path = tempfile.mktemp(suffix='.wav')
        with open(temp_audio_path, 'wb') as f:
            f.write(audio_data_bytes)

        # Initialize recognizer with optimized settings
        recognizer = sr.Recognizer()
        recognizer.energy_threshold = 300
        recognizer.dynamic_energy_threshold = True
        recognizer.pause_threshold = 0.8
        
        with sr.AudioFile(temp_audio_path) as source:
            logger.info("🎤 Recording audio data...")
            audio_data = recognizer.record(source)
            
            logger.info(f"🤖 Transcribing with Google Speech Recognition...")
            
            try:
                text = recognizer.recognize_google(
                    audio_data,
                    language=language
                )
                
                logger.info(f"✅ Transcription successful: '{text}'")
                
                return jsonify({
                    'success': True,
                    'text': text,
                    'language': language
                })
                
            except sr.UnknownValueError:
                logger.warning("❌ Speech not understood")
                return jsonify({
                    'success': False,
                    'error': 'No clear speech detected. Please speak clearly and try again.'
                }), 400
                
            except sr.RequestError as e:
                logger.error(f"❌ Service error: {str(e)}")
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
        logger.error(f"❌ Service error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Speech recognition service error: {str(e)}'
        }), 500
        
    except Exception as e:
        logger.error(f"💥 Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Transcription failed: {str(e)}'
        }), 500
        
    finally:
        # Clean up temporary file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
                logger.info("🧹 Cleaned up temp file")
            except Exception as e:
                logger.error(f"⚠️ Cleanup error: {str(e)}")

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
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'No text provided for synthesis'
            }), 400
        
        logger.info(f"🔊 Synthesizing: '{text[:50]}...' in {language}")
        
        # Use cached synthesis for repeated text (major speed improvement)
        audio_data = generate_speech_cached(text, language)
        
        # Create new buffer from cached data
        audio_buffer = io.BytesIO(audio_data)
        
        logger.info("✅ Speech synthesis successful")
        
        return send_file(
            audio_buffer,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        logger.error(f"❌ Synthesis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Speech synthesis failed: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'speech-service',
        'status': 'healthy', 
        'version': '2.0.0',
        'features': ['speech-to-text', 'text-to-speech', 'tts-caching'],
        'optimizations': [
            'Removed ambient noise adjustment (-0.5s)',
            'TTS caching for repeated text',
            'Optimized file I/O'
        ],
        'supported_languages': {
            'english': 'en-US (transcription), en (synthesis)',
            'swahili': 'sw (transcription & synthesis)'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # REQUIRED: Use Render's PORT environment variable
    port = int(os.environ.get('PORT', 5001))
    
    # REQUIRED: Disable debug in production
    is_production = os.environ.get('FLASK_ENV') == 'production'
    
    logger.info("=" * 60)
    logger.info(f" FLASK SPEECH SERVICE ({'PRODUCTION' if is_production else 'DEV'})")
    logger.info("=" * 60)
    logger.info(f"Port: {port}")
    logger.info(f"Debug: {not is_production}")
    logger.info("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=not is_production, threaded=True)