import { useState } from 'react';

const VoiceInputButton = ({ onTranscript, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice input not supported in this browser. Use Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(`Voice error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div>
      <button
        type="button"
        className={`btn ${isListening ? 'btn-danger' : 'btn-outline'} btn-sm`}
        onClick={startListening}
        disabled={disabled || isListening}
        title="Click to speak"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        {isListening ? (
          <>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'pulse 0.8s infinite' }} />
            Listening...
          </>
        ) : (
          <> Voice Input</>
        )}
      </button>
      {error && (
        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
};

export default VoiceInputButton;