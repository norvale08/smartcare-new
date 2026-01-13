'use client';

import dynamic from 'next/dynamic';

const VoiceInput = dynamic(() => import('../components/voice/VoiceInput'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center p-6">
      <div className="w-20 h-20 rounded-full bg-gray-300 animate-pulse" />
    </div>
  ),
});

export default function VoiceTestPage() {
  const handleTranscription = (text: string) => {
    console.log('Transcribed text:', text);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          🎤 Voice Recognition Test
        </h1>
        
        <VoiceInput 
          onTranscriptionComplete={handleTranscription}
          placeholder="Click the microphone and start speaking..."
        />
      </div>
    </div>
  );
}