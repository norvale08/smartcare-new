import React from 'react';
import { Mic, Volume2, VolumeX, Play, Pause, Square, SkipForward } from 'lucide-react';

interface VoiceModeState {
  active: boolean;
  listening: boolean;
  speaking: boolean;
  currentField: string | null;
  muted: boolean;
  paused: boolean;
  status: string;
}

interface VoiceControlPanelProps {
  voiceModeState: VoiceModeState;
  currentLanguage: any;
  languageValue: string;
  onToggleMute: () => void;
  onToggleVoiceMode: () => void;
  onPauseResume?: () => void;
  onReadContent?: (content: string, type: 'trends' | 'lifestyle' | 'diet' | 'doctor' | 'map') => void;
}

const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({
  voiceModeState,
  currentLanguage,
  languageValue,
  onToggleMute,
  onToggleVoiceMode,
  onPauseResume,
  onReadContent
}) => {
  const { active, listening, speaking, currentField, muted, paused, status } = voiceModeState;

  const handlePauseResumeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onPauseResume) {
      onPauseResume();
    }
  };

  const handleReadContent = (type: 'trends' | 'lifestyle' | 'diet' | 'doctor' | 'map') => {
    if (onReadContent) {
      let contentText = '';
      switch (type) {
        case 'trends':
          contentText = currentLanguage.readHealthTrends || (languageValue === "sw" ? "Soma mabadiliko ya kiafya na hatari" : "Read health trends and risks");
          break;
        case 'lifestyle':
          contentText = currentLanguage.readLifestyle || (languageValue === "sw" ? "Soma maoni ya maisha yako" : "Read lifestyle recommendations");
          break;
        case 'diet':
          contentText = currentLanguage.readDiet || (languageValue === "sw" ? "Soma mapendekezo ya chakula" : "Read diet recommendations");
          break;
        case 'doctor':
          contentText = currentLanguage.readDoctor || (languageValue === "sw" ? "Soma taarifa ya daktari" : "Read doctor information");
          break;
        case 'map':
          contentText = currentLanguage.readMap || (languageValue === "sw" ? "Soma taarifa ya ramani" : "Read map details");
          break;
      }
      onReadContent(contentText, type);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-white/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0 relative">
            {(listening || active) && !paused && (
              <div className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-75"></div>
            )}
            <Mic className="text-white relative z-10" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base sm:text-lg">{currentLanguage.voiceMode || (languageValue === "sw" ? "Hali ya Msaidizi wa Sauti" : "Voice Assistant Mode")}</h3>
            {currentField && (
              <p className="text-white/90 text-xs sm:text-sm">
                {currentLanguage.currentlyReading || (languageValue === "sw" ? "Inasoma": "Currently Reading")}: <span className="font-bold text-emerald-200">{currentField}</span>
              </p>
            )}
            {paused && (
              <p className="text-emerald-300 text-xs sm:text-sm font-semibold animate-pulse">
                ⏸️ {languageValue === "sw" ? "Imesimamishwa" : "Paused"}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all hover:scale-105"
          title={muted ? (languageValue === "sw" ? "Washa sauti" : "Unmute") : (languageValue === "sw" ? "Zima sauti" : "Mute")}
        >
          {muted ? <VolumeX className="text-white" size={20} /> : <Volume2 className="text-white" size={20} />}
        </button>
      </div>
      
      {/* Enhanced Voice Status Display */}
      {(listening || speaking || status) && !paused && (
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-3 animate-in fade-in slide-in-from-top-2 duration-300 border border-emerald-500/30">
          <div className="flex items-center justify-center gap-3">
            {speaking ? (
              <>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-emerald-300 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-3 h-3 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <div className="text-center">
                  <span className="text-white font-bold text-sm block">
                    {languageValue === "sw" ? "NASEMA SASA" : "SPEAKING NOW"}
                  </span>
                  <span className="text-emerald-100 text-xs">
                    {status || (languageValue === "sw" ? "Ninazungumza..." : "Speaking...")}
                  </span>
                </div>
              </>
            ) : listening ? (
              <>
                <div className="relative">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 bg-emerald-300 rounded-full animate-ping" />
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
                  <div className="w-1 h-3 bg-emerald-300 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                  <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-5 bg-emerald-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                  <div className="w-1 h-3 bg-emerald-300 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-white font-semibold text-sm">{status}</span>
              </>
            )}
          </div>
          
          {/* Progress indicator for current field */}
          {currentField && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between text-white/80 text-xs mb-1">
                <span>{languageValue === "sw" ? "Sehemu ya sasa" : "Current Field"}</span>
                <span className="font-bold text-emerald-200">{currentField}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-300 h-2 rounded-full transition-all duration-1000 ease-out"
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

      {/* Control Buttons */}
      {!active ? (
        <button 
          type="button"
          onClick={onToggleVoiceMode}
          className="w-full bg-white text-emerald-700 font-bold py-3 rounded-lg hover:bg-emerald-50 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base animate-in fade-in slide-in-from-top-2 duration-300 shadow-md hover:shadow-lg border border-emerald-200"
        >
          <Play size={20} />
          {currentLanguage.startVoice || (languageValue === "sw" ? "Anza Sauti" : "Start Voice")}
        </button>
      ) : (
        <>
          {/* Pause/Resume Button */}
          {onPauseResume && (
            <button 
              type="button"
              onClick={handlePauseResumeClick}
              className={`w-full mb-2 font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] 
                flex items-center justify-center gap-2 text-sm sm:text-base shadow-md hover:shadow-lg
                ${paused 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400' 
                  : 'bg-emerald-400 hover:bg-emerald-500 text-white border border-emerald-300'
                }`}
            >
              {paused ? (
                <>
                  <Play size={20} />
                  {languageValue === "sw" ? "Endelea" : "Resume"}
                </>
              ) : (
                <>
                  <Pause size={20} />
                  {languageValue === "sw" ? "Simamisha" : "Pause"}
                </>
              )}
            </button>
          )}
          
          {/* Stop Button */}
          <button 
            type="button"
            onClick={onToggleVoiceMode}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base shadow-md hover:shadow-lg border border-emerald-500/50"
          >
            <Square size={20} />
            {currentLanguage.stopVoice || (languageValue === "sw" ? "Sima Sauti" : "Stop Voice")}
          </button>
        </>
      )}

      {/* Content Reading Options */}
      {active && !paused && (
        <div className="mt-4 space-y-3">
          <div className="text-xs text-white/80 font-semibold text-center">
            {languageValue === "sw" ? "Soma Maudhui:" : "Read Content:"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleReadContent('trends')}
              disabled={listening || speaking}
              className="bg-white/20 hover:bg-white/30 text-white text-xs py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {languageValue === "sw" ? "📈 Mabadiliko ya Kiafya" : "📈 Health Trends"}
            </button>
            <button
              type="button"
              onClick={() => handleReadContent('lifestyle')}
              disabled={listening || speaking}
              className="bg-white/20 hover:bg-white/30 text-white text-xs py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {languageValue === "sw" ? "🏃 Maisha" : "🏃 Lifestyle"}
            </button>
            <button
              type="button"
              onClick={() => handleReadContent('diet')}
              disabled={listening || speaking}
              className="bg-white/20 hover:bg-white/30 text-white text-xs py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {languageValue === "sw" ? "🥗 Chakula" : "🥗 Diet"}
            </button>
            <button
              type="button"
              onClick={() => handleReadContent('doctor')}
              disabled={listening || speaking}
              className="bg-white/20 hover:bg-white/30 text-white text-xs py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {languageValue === "sw" ? "👨‍⚕️ Daktari" : "👨‍⚕️ Doctor"}
            </button>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      {active && !paused && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-white/80 text-xs">
          <div className="bg-white/10 p-2 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <span className="font-semibold text-emerald-200">🎯 {languageValue === "sw" ? "Nambari:" : "Numbers:"}</span>
            <p className="mt-1 text-white">{languageValue === "sw" ? "Sema 'mia moja ishirini' kwa 120" : "Say 'one twenty' for 120"}</p>
          </div>
          <div className="bg-white/10 p-2 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <span className="font-semibold text-emerald-200">✅ {languageValue === "sw" ? "Thibitisha:" : "Confirm:"}</span>
            <p className="mt-1 text-white">{languageValue === "sw" ? "Sema 'ndio' au 'hapana'" : "Say 'yes' or 'no'"}</p>
          </div>
        </div>
      )}

      {/* Blood Pressure Specific Tips */}
      {active && !paused && (
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
      )}

      {/* Skip Instructions */}
      {active && !paused && (
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
      )}
    </div>
  );
};

export default VoiceControlPanel;