// apps/web/app/components/diabetesPages/components/SectionVoiceControl.tsx
import React from 'react';
import { Pause, Play } from 'lucide-react';

interface SectionVoiceControlProps {
  sectionName: string;
  voiceModeState: {
    active: boolean;
    listening: boolean;
    speaking: boolean;
    currentField: string | null;
    paused: boolean;
  };
  onPauseResume: () => void;
  languageValue: string;
}

const SectionVoiceControl: React.FC<SectionVoiceControlProps> = ({
  sectionName,
  voiceModeState,
  onPauseResume,
  languageValue
}) => {
  const isPaused = voiceModeState.paused;
  
  // Check if this section is currently active
  const getIsCurrentSection = () => {
    if (!voiceModeState.currentField) return false;
    
    const currentField = voiceModeState.currentField.toLowerCase();
    const normalizedSectionName = sectionName.toLowerCase();
    
    console.log(`[SectionVoiceControl] Checking: section="${sectionName}", currentField="${currentField}", paused=${isPaused}`);
    
    const sectionFieldMap: Record<string, string[]> = {
      'glucose': ['glucose'],
      'cardiovascular': ['systolic', 'diastolic', 'heartrate'],
      'context': ['context'],
      'meal': ['lastmealtime', 'mealtype', 'lastmeal', 'mealtype'],
      'exercise': ['exerciserecent', 'exerciseintensity']
    };
    
    // Check if any field in this section matches current field
    const fieldsInSection = sectionFieldMap[normalizedSectionName] || [];
    return fieldsInSection.some(field => 
      currentField.includes(field) || field.includes(currentField)
    );
  };
  
  const isCurrentSection = getIsCurrentSection();
  
  // Show when voice mode is active AND this section is currently being processed
  // OR when voice is paused (to allow resuming)
  const shouldShow = voiceModeState.active && 
                    (isCurrentSection || voiceModeState.paused);
  
  console.log(`[SectionVoiceControl] section="${sectionName}", shouldShow=${shouldShow}, isCurrentSection=${isCurrentSection}, paused=${isPaused}`);

  if (!shouldShow) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`[SectionVoiceControl] Button clicked for section: ${sectionName}`);
    console.log('Current state:', voiceModeState);
    
    // Call the pause/resume handler
    onPauseResume();
  };

  // Get appropriate button text and colors
  const getButtonConfig = () => {
    if (isPaused) {
      return {
        bgColor: 'bg-green-500 hover:bg-green-600',
        ringColor: 'ring-green-300',
        icon: <Play size={16} />,
        text: languageValue === "sw" ? "Endelea" : "Resume",
        title: languageValue === "sw" ? "Endelea na sauti" : "Resume voice mode",
        disabled: false,
        isActive: false,
        animation: ''
      };
    } else {
      // If this is the current section being read, use BRIGHT YELLOW with animation
      const isActiveSection = isCurrentSection;
      return {
        bgColor: isActiveSection ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-yellow-500 hover:bg-yellow-600',
        ringColor: isActiveSection ? 'ring-yellow-200' : 'ring-yellow-300',
        icon: <Pause size={16} />,
        text: languageValue === "sw" ? "Simamisha" : "Pause",
        title: languageValue === "sw" ? "Simamisha sauti kwa muda" : "Pause voice mode temporarily",
        disabled: false,
        isActive: isActiveSection,
        animation: isActiveSection ? 'animate-pulse' : ''
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="flex justify-end mb-3 gap-2 z-10 relative animate-in fade-in slide-in-from-top-2 duration-300">
      <button
        type="button"
        onClick={handleClick}
        disabled={buttonConfig.disabled}
        className={`
          px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2
          ${buttonConfig.bgColor} text-white shadow-lg
          cursor-pointer hover:shadow-xl active:scale-95 transform
          ring-2 ring-offset-2 ${buttonConfig.ringColor}
          ${buttonConfig.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${buttonConfig.animation}
        `}
        title={buttonConfig.title}
        aria-label={buttonConfig.title}
      >
        {buttonConfig.icon}
        <span className="font-bold">{buttonConfig.text}</span>
      </button>

      {/* Status indicator */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
        <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-gray-400' : 'bg-blue-500 animate-ping'}`} />
        <span className="font-semibold">
          {isPaused 
            ? (languageValue === "sw" ? "Imesimamishwa" : "Paused")
            : voiceModeState.listening
            ? (languageValue === "sw" ? "Inasikiliza" : "Listening")
            : voiceModeState.speaking
            ? (languageValue === "sw" ? "Inazungumza" : "Speaking")
            : (languageValue === "sw" ? "Inatumika" : "Active")
          }
        </span>
      </div>
    </div>
  );
};

export default SectionVoiceControl;