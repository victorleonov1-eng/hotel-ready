import { useState, useRef, useEffect } from 'react';
import type { Scenario, ScoreResult, Recording, Message as TypeMessage } from '../content/types';
import { ScoreCard } from './ScoreCard';
import { saveRecording } from '../state/recordings';

type Message = TypeMessage;
type AudioDataMap = Record<string, string>; // timestamp -> base64

type Props = {
  scenario: Scenario;
  onDone: (score: number, seconds: number, usedCards: boolean, recordingId: string) => void;
  onBack: () => void;
  bestTime?: number;
};

type AnswerOption = { text: string; rank: 1 | 2 | 3 | 4 | 5 };

type Voice = {
  id: string;
  name: string;
  value: string;
};

export function RolePlay({ scenario, onDone, onBack, bestTime }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const [started, setStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [usedCards, setUsedCards] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<AnswerOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('EXAVITQu4vr4xnSDxMaL'); // Bella
  const [useTTS, setUseTTS] = useState(() => {
    try {
      return localStorage.getItem('hotelready.usetts') !== 'false';
    } catch {
      return true;
    }
  });
  const [audioData, setAudioData] = useState<AudioDataMap>({});
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messageTimestampRef = useRef<number>(Date.now());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (started && !scoreResult) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [started, scoreResult]);

  useEffect(() => {
    // Load available voices from server
    fetch('/api/voices')
      .then((res) => res.json())
      .then((data) => {
        const voiceList = Object.entries(data).map(([, value]: any) => ({
          id: value.id,
          name: value.name,
          description: value.description,
          value: value.id,
        }));
        setVoices(voiceList);
      })
      .catch(() => {
        // Fallback to default voices if API fails
        const defaultVoices = [
          { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Professional)', description: 'Warm and professional', value: 'EXAVITQu4vr4xnSDxMaL' },
          { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Friendly)', description: 'Friendly and approachable', value: 'MF3mGyEYCl7XYWbV9V6O' },
          { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Chris (Assertive)', description: 'Confident and authoritative', value: 'TxGEqnHWrfWFTfGW9XjX' },
        ];
        setVoices(defaultVoices);
      });
  }, []);

  function startScenario() {
    setStarted(true);
    const timestamp = Date.now();
    messageTimestampRef.current = timestamp;
    const opening: Message = { role: 'guest', text: scenario.guestOpeningLine, timestamp };
    setMessages([opening]);
    speak(scenario.guestOpeningLine, undefined, timestamp);
  }

  async function speak(text: string, emotion?: string, timestamp?: number) {
    // Try ElevenLabs TTS if enabled
    if (useTTS && selectedVoice) {
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceId: selectedVoice,
            emotion,
          }),
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });

          // Capture audio for recording
          if (timestamp) {
            blobToBase64(blob).then((base64) => {
              setAudioData((prev) => ({ ...prev, [timestamp]: base64 }));
            });
          }

          const url = URL.createObjectURL(blob);

          if (!audioRef.current) {
            audioRef.current = new Audio();
          }

          audioRef.current.src = url;
          audioRef.current.play().catch((err) => {
            console.log('Audio playback error, falling back to browser TTS:', err);
            speakBrowser(text, emotion);
          });
          return;
        }
      } catch (err) {
        console.log('ElevenLabs TTS error, falling back to browser TTS:', err);
      }
    }

    // Fallback to browser speechSynthesis
    speakBrowser(text, emotion);
  }

  function speakBrowser(text: string, emotion?: string) {
    try {
      const utter = new SpeechSynthesisUtterance(text);

      // Adjust voice characteristics based on guest emotion
      switch (emotion) {
        case 'angry':
        case 'irritated':
          utter.rate = 0.75; // Slower, more deliberate
          utter.pitch = 0.8; // Lower pitch
          break;
        case 'warming':
        case 'satisfied':
          utter.rate = 1.1; // Faster, more upbeat
          utter.pitch = 1.2; // Higher pitch
          break;
        case 'anxious':
          utter.rate = 1.15; // Slightly faster due to nervousness
          utter.pitch = 1.0;
          break;
        default: // neutral
          utter.rate = 0.95;
          utter.pitch = 1.0;
      }

      synthRef.current.speak(utter);
    } catch {}
  }

  async function getAnswerOptions() {
    if (messages.length === 0) return;
    setOptionsLoading(true);
    const transcript = messages
      .map((m) => `${m.role === 'staff' ? 'STAFF' : 'GUEST'}: ${m.text}`)
      .join('\n');

    try {
      const res = await fetch('/api/answer-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, transcript }),
      });
      const data = await res.json();
      setOptions(Array.isArray(data) ? data : data.options || []);
      setShowOptions(true);
      setUsedCards(true);
    } catch (err) {
      console.error('Error fetching options:', err);
    }
    setOptionsLoading(false);
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const timestamp = Date.now();
    const staffMsg: Message = { role: 'staff', text, timestamp };
    const updated = [...messages, staffMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = updated.map((m) => ({
        role: (m.role === 'staff' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const res = await fetch('/api/guest-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, messages: apiMessages }),
      });
      const data = await res.json();
      const guestTimestamp = Date.now();
      const guestMsg: Message = {
        role: 'guest',
        text: data.reply || data.text,
        emotion: data.emotion,
        timestamp: guestTimestamp,
      };
      setMessages([...updated, guestMsg]);
      speak(data.reply || data.text, data.emotion, guestTimestamp);
    } catch (err) {
      const errorTimestamp = Date.now();
      setMessages([...updated, { role: 'guest', text: '(Error getting response. Try again.)', timestamp: errorTimestamp }]);
    }
    setLoading(false);
  }

  async function endAndScore() {
    setScoring(true);
    if (timerRef.current) clearInterval(timerRef.current);
    synthRef.current.cancel();
    const transcript = messages
      .map((m) => `${m.role === 'staff' ? 'STAFF' : 'GUEST'}: ${m.text}`)
      .join('\n');

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, transcript }),
      });
      const result: ScoreResult = await res.json();
      setScoreResult(result);

      // Save recording if audio was captured
      let recordingId = '';
      if (messages.length > 0) {
        const attemptId = `${scenario.id}-${Date.now()}`;
        recordingId = attemptId;
        const recording: Recording = {
          attemptId,
          scenarioId: scenario.id,
          messages,
          score: result.overall,
          seconds,
          usedCards,
          recordedAt: new Date().toISOString(),
          audioData: Object.keys(audioData).length > 0 ? audioData : undefined,
        };
        saveRecording(recording);
      }

      onDone(result.overall, seconds, usedCards, recordingId);
    } catch {
      setScoreResult(null);
    }
    setScoring(false);
  }

  const hasSpeechRecognition = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  if (scoreResult) {
    return (
      <ScoreCard
        result={scoreResult}
        seconds={seconds}
        bestTime={bestTime}
        onRetry={() => {
          setMessages([]);
          setScoreResult(null);
          setStarted(false);
          setSeconds(0);
          setUsedCards(false);
        }}
        onBack={onBack}
      />
    );
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-lg mx-auto">
      <div className="px-4 py-3 border-b">
        <button onClick={onBack} className="text-sm text-crimson underline mb-1">
          &larr; Back
        </button>
        <h3 className="font-bold text-crimson-dark text-sm">{scenario.title}</h3>
        <p className="text-xs text-gray-500 mt-1">{scenario.situation}</p>

        {!started && (
          <div className="mt-3 space-y-2">
            <label className="block">
              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                🎙️ Guest Voice {voices.length > 0 && '(Premium TTS)'}
              </div>
              {voices.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-crimson"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  {voices.find((v) => v.id === selectedVoice)?.description && (
                    <div className="text-xs text-gray-600 italic">
                      {voices.find((v) => v.id === selectedVoice)?.description}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">Loading voices...</div>
              )}
            </label>
            {voices.length > 0 && (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={useTTS}
                  onChange={(e) => {
                    setUseTTS(e.target.checked);
                    localStorage.setItem('hotelready.usetts', e.target.checked ? 'true' : 'false');
                  }}
                  className="rounded"
                />
                <span className="text-gray-600">Enable premium voice</span>
              </label>
            )}
          </div>
        )}

        {started && (
          <div className="mt-2 text-sm font-semibold text-teal">
            ⏱ {formatTime(seconds)}
            {bestTime && seconds < bestTime && ' (beating your best!)'}
          </div>
        )}
      </div>

      {!started ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <button
            onClick={startScenario}
            className="bg-crimson text-white px-8 py-4 rounded-xl text-lg font-semibold"
          >
            Start conversation
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => {
              const emotionEmoji = {
                angry: '😠',
                irritated: '😤',
                neutral: '😐',
                warming: '🙂',
                satisfied: '😊',
                anxious: '😟',
              } as Record<string, string>;

              return (
                <div key={i} className={`flex ${m.role === 'staff' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      m.role === 'staff'
                        ? 'bg-teal text-white'
                        : 'bg-crimson-light text-crimson-dark'
                    }`}
                  >
                    <span className="text-xs font-medium opacity-70 block mb-0.5 flex items-center gap-1">
                      {m.role === 'staff' ? 'You' : 'Guest'} {m.emotion && emotionEmoji[m.emotion]}
                    </span>
                    {m.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-crimson-light text-crimson-dark rounded-xl px-3 py-2 text-sm animate-pulse">
                  Guest is thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t px-4 py-3">
            {scoring ? (
              <div className="text-center text-crimson font-medium animate-pulse">Scoring your performance...</div>
            ) : (
              <>
                {showOptions && options.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-900">Suggested responses (ranked by effectiveness)</span>
                      <button
                        onClick={() => setShowOptions(false)}
                        className="text-xs text-blue-600 hover:text-blue-900"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-2">
                      {options
                        .sort((a, b) => b.rank - a.rank)
                        .map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setInput(opt.text);
                              setShowOptions(false);
                            }}
                            className="w-full text-left text-sm p-2 bg-white border border-blue-100 rounded hover:bg-blue-50 transition"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-blue-600 text-xs min-w-fit">★{opt.rank}</span>
                              <span className="text-gray-700">{opt.text}</span>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your response..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-crimson"
                    disabled={loading}
                  />
                  {hasSpeechRecognition && (
                    <button
                      onClick={toggleMic}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        listening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {listening ? '...' : '🎙'}
                    </button>
                  )}
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>

                <div className="flex gap-2 mb-2">
                  <button
                    onClick={getAnswerOptions}
                    disabled={optionsLoading || messages.length === 0}
                    className="flex-1 text-sm px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 disabled:opacity-50"
                  >
                    {optionsLoading ? 'Loading...' : '💡 Stuck? See options'}
                  </button>
                  <button
                    onClick={endAndScore}
                    disabled={messages.filter((m) => m.role === 'staff').length === 0}
                    className="flex-1 text-sm text-crimson font-medium py-2 disabled:opacity-30"
                  >
                    End & Score
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}
