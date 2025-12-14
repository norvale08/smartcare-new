"use client";
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Pause, Play, Square } from 'lucide-react';

interface SectionVoiceControlProps {
  sectionId: string;
  sectionLabel: string;
  languageValue: 'en' | 'sw';
  currentLanguage: any;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onToggleMute?: () => void;
  isActive?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  showAlways?: boolean;
}

const SectionVoiceControl: React.FC<SectionVoiceControlProps> = ({
  sectionId,
  sectionLabel,
  languageValue,
  currentLanguage,
  onPause,
  onResume,
  onStop,
  onToggleMute,
  isActive = false,
  isListening = false,
  isSpeaking = false,
  isMuted = false,
  showAlways = false
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [localActive, setLocalActive] = useState(false);

  // Update local active state when section becomes active
  useEffect(() => {
    if (isActive) {
      setLocalActive(true);
      setIsPaused(false);
    } else if (!isListening && !isSpeaking) {
      setLocalActive(false);
    }
  }, [isActive, isListening, isSpeaking]);

  const handlePause = () => {
    setIsPaused(true);
    onPause?.();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResume?.();
  };

  const handleStop = () => {
    setIsPaused(false);
    setLocalActive(false);
    onStop?.();
  };

  // Only show controls if active or showAlways is true
  if (!showAlways && !localActive && !isActive) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-100">
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isListening ? 'bg-green-500 animate-pulse' : 
          isSpeaking ? 'bg-blue-500' : 
          'bg-gray-300'
        }`}>
          {isListening ? (
            <Mic className="w-3 h-3 text-white" />
          ) : isSpeaking ? (
            <Volume2 className="w-3 h-3 text-white" />
          ) : null}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {sectionLabel}
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
          {languageValue === 'sw' ? 'Sauti' : 'Voice'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Mute/Unmute Button */}
        {onToggleMute && (
          <button
            type="button"
            onClick={onToggleMute}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title={isMuted ? 
              (languageValue === 'sw' ? 'Wezesha sauti' : 'Unmute') : 
              (languageValue === 'sw' ? 'Zima sauti' : 'Mute')
            }
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}

        {/* Pause/Resume Button */}
        {(isListening || isSpeaking) && onPause && onResume && (
          <button
            type="button"
            onClick={isPaused ? handleResume : handlePause}
            className={`p-1.5 rounded-lg transition-colors ${
              isPaused ? 'bg-yellow-100 hover:bg-yellow-200' : 'bg-blue-100 hover:bg-blue-200'
            }`}
            title={isPaused ? 
              (languageValue === 'sw' ? 'Endelea' : 'Resume') : 
              (languageValue === 'sw' ? 'Sitisha kwa muda' : 'Pause')
            }
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-yellow-700" />
            ) : (
              <Pause className="w-4 h-4 text-blue-700" />
            )}
          </button>
        )}

        {/* Stop Button */}
        {(isListening || isSpeaking || localActive) && onStop && (
          <button
            type="button"
            onClick={handleStop}
            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
            title={languageValue === 'sw' ? 'Acha' : 'Stop'}
          >
            <Square className="w-4 h-4 text-red-700" />
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <div className="sm:hidden text-xs text-gray-500">
        {isListening ? (
          <span className="text-green-600">● {currentLanguage.listening || 'Listening...'}</span>
        ) : isSpeaking ? (
          <span className="text-blue-600">● {currentLanguage.speaking || 'Speaking...'}</span>
        ) : isPaused ? (
          <span className="text-yellow-600">● {languageValue === 'sw' ? 'Imezimwa kwa muda' : 'Paused'}</span>
        ) : null}
      </div>
    </div>
  );
};

export default SectionVoiceControl;