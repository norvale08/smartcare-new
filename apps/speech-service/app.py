from flask import Flask, request, jsonify, send_file
import speech_recognition as sr
import tempfile
import os
import logging
from datetime import datetime
from gtts import gTTS
import io

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

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
        # Get language from form data, default to en-US
        language = request.form.get('language', 'en-US')
        
        if audio_file.filename == '':
            logger.error("Empty filename")
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        file_size = len(audio_file.read())
        audio_file.seek(0)  # Reset file pointer
        logger.info(f"📁 Received audio file: {audio_file.filename}, size: {file_size} bytes, language: {language}")

        # Save to temporary file
        temp_audio_path = tempfile.mktemp(suffix='.wav')
        audio_file.save(temp_audio_path)
        
        logger.info(f"💾 Saved temporary file: {temp_audio_path}, size: {file_size} bytes")

        # Initialize recognizer
        recognizer = sr.Recognizer()
        
        with sr.AudioFile(temp_audio_path) as source:
            logger.info("🔊 Reading audio file...")
            
            # Configure recognizer settings
            recognizer.energy_threshold = 300
            recognizer.dynamic_energy_threshold = True
            recognizer.pause_threshold = 0.8
            
            # Adjust for ambient noise (optional)
            try:
                logger.info("🎵 Adjusting for ambient noise...")
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                logger.info("✅ Noise adjustment successful")
            except Exception as e:
                logger.warning(f"⚠️ Noise adjustment failed: {e}")
                # Continue without noise adjustment
            
            logger.info("🎤 Recording audio data...")
            
            # Record the audio
            audio_data = recognizer.record(source)
            logger.info("✅ Audio recording complete")
            
            logger.info(f"🤖 Transcribing with Google Speech Recognition (language: {language})...")
            
            # Transcribe with Google Speech Recognition using provided language
            try:
                text = recognizer.recognize_google(
                    audio_data,
                    language=language,
                    show_all=False
                )
                
                logger.info(f"✅ Transcription successful: '{text}'")
                
                return jsonify({
                    'success': True,
                    'text': text,
                    'language': language
                })
                
            except sr.UnknownValueError:
                logger.warning("❌ Speech recognition could not understand audio")
                return jsonify({
                    'success': False,
                    'error': 'No clear speech detected. Please speak clearly and try again.'
                }), 400
                
            except sr.RequestError as e:
                logger.error(f"❌ Speech recognition service error: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': f'Speech recognition service error: {str(e)}'
                }), 500
                    
    except sr.UnknownValueError:
        logger.warning("❌ Speech recognition could not understand audio")
        return jsonify({
            'success': False,
            'error': 'No clear speech detected. Please speak clearly and try again.'
        }), 400
        
    except sr.RequestError as e:
        logger.error(f"❌ Speech recognition service error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Speech recognition service error: {str(e)}'
        }), 500
        
    except Exception as e:
        logger.error(f"💥 Unexpected error during transcription: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Transcription failed: {str(e)}'
        }), 500
        
    finally:
        # Clean up temporary file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
                logger.info("🧹 Cleaned up temporary file")
            except Exception as e:
                logger.error(f"⚠️ Error cleaning up temp file: {str(e)}")

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
        
        logger.info(f"🔊 Synthesizing speech: '{text}' in language: {language}")
        
        # Create speech using gTTS (Google Text-to-Speech)
        # Use 'sw' for Swahili, 'en' for English
        tts = gTTS(text=text, lang=language, slow=False)
        
        # Save to bytes buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        logger.info("✅ Speech synthesis successful")
        
        # Return audio data as MP3
        return send_file(
            audio_buffer,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        logger.error(f"❌ Speech synthesis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Speech synthesis failed: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'speech-service',
        'status': 'healthy', 
        'version': '1.0.0',
        'features': ['speech-to-text', 'text-to-speech'],
        'supported_languages': {
            'english': 'en-US (transcription), en (synthesis)',
            'swahili': 'sw (transcription & synthesis)'
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("🚀 STARTING FLASK SPEECH SERVICE")
    logger.info("=" * 60)
    logger.info("🌐 Server will start on: http://0.0.0.0:5000")
    logger.info("❤️ Health check: http://localhost:5000/health")
    logger.info("🎤 Transcribe endpoint: http://localhost:5000/transcribe")
    logger.info("🔊 Synthesize endpoint: http://localhost:5000/synthesize")
    logger.info("🗣️  Supports: English (en-US/en) & Swahili (sw)")
    logger.info("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)