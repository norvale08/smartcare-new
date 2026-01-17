// apps/web/app/components/diabetesPages/components/VoiceControlPanel.tsx
import React from 'react';
import { Mic, Volume2, VolumeX, Play, Pause, Square } from 'lucide-react';

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
  onPauseResume: () => void;
}

const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({
  voiceModeState,
  currentLanguage,
  languageValue,
  onToggleMute,
  onToggleVoiceMode,
  onPauseResume
}) => {
  const { active, listening, speaking, muted, paused } = voiceModeState;

  return (
    <div className="bg-emerald-500 rounded-lg p-2 sm:p-2.5 border border-white/20">
      <div className="flex items-center justify-between gap-2">
        {/* Voice Icon & Status */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 relative">
            {(listening || active) && !paused && (
              <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-75"></div>
            )}
            <Mic className="text-white relative z-10" size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-xs sm:text-sm truncate">
              {active ? (
                paused ? (
                  <span className="text-cyan-200">⏸️ {languageValue === "sw" ? "Imesimamishwa" : "Paused"}</span>
                ) : speaking ? (
                  <span>{languageValue === "sw" ? "Ninazungumza..." : "Speaking..."}</span>
                ) : listening ? (
                  <span>{languageValue === "sw" ? "Ninasikiliza..." : "Listening..."}</span>
                ) : (
                  currentLanguage.voiceMode
                )
              ) : (
                currentLanguage.voiceMode
              )}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Mute Button */}
          {active && (
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1 sm:p-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-all"
              title={muted ? (languageValue === "sw" ? "Washa sauti" : "Unmute") : (languageValue === "sw" ? "Zima sauti" : "Mute")}
            >
              {muted ? <VolumeX className="text-white" size={14} /> : <Volume2 className="text-white" size={14} />}
            </button>
          )}
          
          {/* Pause/Resume Button */}
          {active && (
            <button 
              type="button"
              onClick={onPauseResume}
              className="p-1 sm:p-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-all"
              title={paused ? (languageValue === "sw" ? "Endelea" : "Resume") : (languageValue === "sw" ? "Simamisha" : "Pause")}
            >
              {paused ? <Play className="text-white" size={14} /> : <Pause className="text-white" size={14} />}
            </button>
          )}
          
          {/* Start/Stop Button */}
          <button 
            type="button"
            onClick={onToggleVoiceMode}
            className={`p-1 sm:p-1.5 rounded-md transition-all font-medium text-xs px-2 sm:px-3 ${
              active 
                ? 'bg-white/90 text-emerald-700 hover:bg-white' 
                : 'bg-white text-emerald-700 hover:bg-cyan-50'
            }`}
          >
            {active ? (
              <>
                <Square className="inline w-3 h-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">{languageValue === "sw" ? "Komesha" : "Stop"}</span>
              </>
            ) : (
              <>
                <Play className="inline w-3 h-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">{languageValue === "sw" ? "Anza" : "Start"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceControlPanel;