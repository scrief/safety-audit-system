import React from 'react';
import { Mic, MicOff } from 'lucide-react';

type SpeechToTextProps = {
  onTranscript: (text: string) => void;
};

const SpeechToText: React.FC<SpeechToTextProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = React.useState(false);

  return (
    <button
      onClick={() => setIsListening(!isListening)}
      className={`p-2 rounded-full ${
        isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
};

export default SpeechToText;