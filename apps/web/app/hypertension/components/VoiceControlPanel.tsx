// apps/web/app/hypertension/components/VoiceControlPanel.tsx
import React from 'react';
import { Mic, Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';
import { VoiceModeState } from '../utils/voiceUtils';

interface VoiceControlPanelProps {
  voiceModeState: VoiceModeState;
  currentLanguage: any;
  languageValue: string;
  onToggleMute: () => void;
  onToggleVoiceMode: () => void;
}

const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({
  voiceModeState,
  currentLanguage,
  languageValue,
  onToggleMute,
  onToggleVoiceMode
}) => {
  const { active, listening, speaking, currentField, muted, status } = voiceModeState;

  return (
    <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0 relative">
            {(listening || active) && (
              <div className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-75"></div>
            )}
            <Mic className="text-white relative z-10" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base sm:text-lg">{currentLanguage.voiceMode}</h3>
            {currentField && (
              <p className="text-white/90 text-xs sm:text-sm">
                {currentLanguage.currentlyReading}: <span className="font-bold">{currentField}</span>
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
          title={muted ? (languageValue === "sw" ? "Washa sauti" : "Unmute") : (languageValue === "sw" ? "Zima sauti" : "Mute")}
        >
          {muted ? <VolumeX className="text-white" size={20} /> : <Volume2 className="text-white" size={20} />}
        </button>
      </div>
      
      {/* Enhanced Voice Status Display */}
      {(listening || speaking || status) && (
        <div className="bg-white/20 backdrop-blur rounded-lg p-4 mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-center gap-3">
            {speaking ? (
              <>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <div className="text-center">
                  <span className="text-white font-bold text-sm block">
                    {languageValue === "sw" ? "NASEMA SASA" : "SPEAKING NOW"}
                  </span>
                  <span className="text-white/80 text-xs">
                    {status || (languageValue === "sw" ? "Ninazungumza..." : "Speaking...")}
                  </span>
                </div>
              </>
            ) : listening ? (
              <>
                <div className="relative">
                  <div className="w-4 h-4 bg-emerald-200 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 bg-emerald-100 rounded-full animate-ping" />
                </div>
                <div className="text-center">
                  <span className="text-white font-bold text-sm block">
                    {languageValue === "sw" ? "ZUNGUMZA SASA" : "SPEAK NOW"}
                  </span>
                  <span className="text-white/80 text-xs">
                    {status || (languageValue === "sw" ? "Ninasikiliza..." : "Listening...")}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                  <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                  <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-green-200 rounded-full animate-pulse" />
                <span className="text-white font-semibold text-sm">{status}</span>
              </>
            )}
          </div>
          
          {/* Progress indicator for current field */}
          {currentField && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between text-white/80 text-xs mb-1">
                <span>{languageValue === "sw" ? "Sehemu ya sasa" : "Current Field"}</span>
                <span className="font-bold">{currentField}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div 
                  className="bg-emerald-200 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: listening ? '100%' : '0%',
                    animation: listening ? 'pulse 2s infinite' : 'none'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button 
        type="button"
        onClick={onToggleVoiceMode}
        disabled={listening || speaking}
        className="w-full bg-white text-emerald-600 font-bold py-3 rounded-lg hover:bg-emerald-50 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white animate-in fade-in slide-in-from-top-2 duration-300"
      >
        {active ? (
          <>
            <Pause size={20} />
            {currentLanguage.stopVoice}
          </>
        ) : (
          <>
            <Play size={20} />
            {currentLanguage.startVoice}
          </>
        )}
      </button>

      {/* Skip Instructions */}
      <div className="mt-3 p-3 bg-white/10 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2 text-white/80 text-xs">
          <SkipForward size={14} />
          <span>
            {languageValue === "sw" 
              ? "Sema 'ruka' kwa Kiswahili au 'skip' kwa Kiingereza kuruka kipimo" 
              : "Say 'skip' in English or 'ruka' in Swahili to skip a measurement"}
          </span>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-white/80 text-xs">
        <div className="bg-white/10 p-2 rounded-lg">
          <span className="font-semibold">🎯 {languageValue === "sw" ? "Nambari:" : "Numbers:"}</span>
          <p className="mt-1">{languageValue === "sw" ? "Sema 'mia moja ishirini' kwa 120" : "Say 'one twenty' for 120"}</p>
        </div>
        <div className="bg-white/10 p-2 rounded-lg">
          <span className="font-semibold">✅ {languageValue === "sw" ? "Thibitisha:" : "Confirm:"}</span>
          <p className="mt-1">{languageValue === "sw" ? "Sema 'ndio' au 'hapana'" : "Say 'yes' or 'no'"}</p>
        </div>
      </div>

      {/* Blood Pressure Specific Tips */}
      <div className="mt-3 bg-white/10 p-3 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
        <span className="font-semibold text-white text-xs block mb-1">
          {languageValue === "sw" ? "🩺 Tips za Shinikizo la Damu:" : "🩺 BP Tips:"}
        </span>
        <p className="text-white/80 text-xs">
          {languageValue === "sw" 
            ? "Systolic ni nambari ya juu, diastolic ni nambari ya chini. Pima mara tatu kwa usahihi."
            : "Systolic is the top number, diastolic is the bottom number. Measure three times for accuracy."}
        </p>
      </div>
    </div>
  );
};

export default VoiceControlPanel;