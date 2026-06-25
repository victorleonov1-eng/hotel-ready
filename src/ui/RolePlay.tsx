import { useState, useRef, useEffect } from 'react';
import type { Scenario, ScoreResult } from '../content/types';
import { ScoreCard } from './ScoreCard';

type Message = { role: 'staff' | 'guest'; text: string };

type Props = {
  scenario: Scenario;
  onDone: (score: number, seconds: number, usedCards: boolean) => void;
  onBack: () => void;
  bestTime?: number;
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
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  function startScenario() {
    setStarted(true);
    const opening: Message = { role: 'guest', text: scenario.guestOpeningLine };
    setMessages([opening]);
    speak(scenario.guestOpeningLine);
  }

  function speak(text: string) {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      synthRef.current.speak(utter);
    } catch {}
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

    const staffMsg: Message = { role: 'staff', text };
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
      const guestMsg: Message = { role: 'guest', text: data.reply || data.text };
      setMessages([...updated, guestMsg]);
      speak(data.reply || data.text);
    } catch (err) {
      setMessages([...updated, { role: 'guest', text: '(Error getting response. Try again.)' }]);
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
      onDone(result.overall, seconds, usedCards);
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
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'staff' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    m.role === 'staff'
                      ? 'bg-teal text-white'
                      : 'bg-crimson-light text-crimson-dark'
                  }`}
                >
                  <span className="text-xs font-medium opacity-70 block mb-0.5">
                    {m.role === 'staff' ? 'You' : 'Guest'}
                  </span>
                  {m.text}
                </div>
              </div>
            ))}
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
                <button
                  onClick={endAndScore}
                  disabled={messages.filter((m) => m.role === 'staff').length === 0}
                  className="w-full text-sm text-crimson font-medium py-1 disabled:opacity-30"
                >
                  End & Score
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
