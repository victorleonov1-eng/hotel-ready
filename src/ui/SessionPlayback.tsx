import { useState, useRef, useEffect } from 'react';
import type { Recording, Scenario } from '../content/types';

type Props = {
  recording: Recording;
  scenario: Scenario;
  score: number;
  onBack: () => void;
};

export function SessionPlayback({ recording, scenario, score, onBack }: Props) {
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlayMessage = (idx: number) => {
    setCurrentMessageIdx(idx);
    const msg = recording.messages[idx];

    if (!msg || msg.role === 'staff') return;

    // Play audio if available
    if (recording.audioData && msg.timestamp.toString() in recording.audioData) {
      const audioBase64 = recording.audioData[msg.timestamp.toString()];
      const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
        // Auto-advance to next message
        if (idx < recording.messages.length - 1) {
          setTimeout(() => handlePlayMessage(idx + 1), 300);
        }
      };

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(p);
        }
      };
    }
  };

  const handlePlayAll = () => {
    setCurrentMessageIdx(0);
    playNextMessage(0);
  };

  function playNextMessage(idx: number) {
    if (idx >= recording.messages.length) {
      setIsPlaying(false);
      setCurrentMessageIdx(0);
      return;
    }

    const msg = recording.messages[idx];
    if (msg.role === 'staff') {
      // Skip staff messages, go to next
      playbackTimeoutRef.current = setTimeout(() => playNextMessage(idx + 1), 800);
      return;
    }

    setCurrentMessageIdx(idx);

    // Play audio
    if (recording.audioData && msg.timestamp.toString() in recording.audioData) {
      const audioBase64 = recording.audioData[msg.timestamp.toString()];
      const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        playbackTimeoutRef.current = setTimeout(() => playNextMessage(idx + 1), 500);
      };
      audioRef.current.play();
    } else {
      playbackTimeoutRef.current = setTimeout(() => playNextMessage(idx + 1), 1000);
    }
  }

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto">
      <div className="px-4 py-3 border-b">
        <button onClick={onBack} className="text-sm text-crimson underline mb-2">
          &larr; Back
        </button>
        <h3 className="font-bold text-crimson-dark text-base">{scenario.title}</h3>
        <p className="text-xs text-gray-600 mt-1">{scenario.situation}</p>
        <div className="flex gap-4 mt-2 text-xs text-gray-600">
          <span>Score: {score}</span>
          <span>Duration: {formatTime(recording.seconds)}</span>
          <span>Recorded: {new Date(recording.recordedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {recording.messages.map((msg, idx) => {
          const emotionEmoji = {
            angry: '😠',
            irritated: '😤',
            neutral: '😐',
            warming: '🙂',
            satisfied: '😊',
            anxious: '😟',
          } as Record<string, string>;

          const isCurrentMessage = idx === currentMessageIdx;
          const hasAudio = recording.audioData && msg.timestamp.toString() in recording.audioData;

          return (
            <div key={idx} className={`flex ${msg.role === 'staff' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'staff'
                    ? 'bg-teal text-white'
                    : isCurrentMessage && hasAudio
                      ? 'bg-crimson text-white ring-2 ring-crimson'
                      : 'bg-crimson-light text-crimson-dark'
                }`}
              >
                <span className="text-xs font-medium opacity-70 block mb-0.5 flex items-center gap-1">
                  {msg.role === 'staff' ? 'You' : 'Guest'} {msg.emotion && emotionEmoji[msg.emotion]}
                </span>
                <div className="flex items-start gap-2">
                  {msg.role === 'guest' && hasAudio && (
                    <button
                      onClick={() => handlePlayMessage(idx)}
                      className="text-xs mt-0.5 hover:opacity-75"
                      title="Play message"
                    >
                      {isCurrentMessage && isPlaying ? '⏸' : '▶'}
                    </button>
                  )}
                  <div>{msg.text}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t px-4 py-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handlePlayAll}
            disabled={isPlaying}
            className="flex-1 bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isPlaying ? '▶ Playing...' : '▶ Play All'}
          </button>
          {isPlaying && (
            <button
              onClick={handlePause}
              className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              ⏸ Pause
            </button>
          )}
        </div>

        {isPlaying && (
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-teal h-1 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <p className="text-xs text-gray-600 text-center">
          {isPlaying ? '🔊 Playing recording...' : 'Click play button above or individual messages to review'}
        </p>
      </div>
    </div>
  );
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
