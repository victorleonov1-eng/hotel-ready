import { useState, useEffect } from 'react';

const HOTEL_NAME = 'Hotel Name';

type HeaderProps = {
  onMuteToggle?: (muted: boolean) => void;
  muted?: boolean;
};

export function Header({ onMuteToggle, muted = false }: HeaderProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <header className="bg-crimson text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div>
        <h1 className="text-xl font-bold tracking-tight">HOTEL Ready</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-center text-sm">
          <div className="font-semibold">{HOTEL_NAME}</div>
          <div className="text-xs opacity-90">
            {dateStr} {timeStr}
          </div>
        </div>
        {onMuteToggle && (
          <button
            onClick={() => onMuteToggle(!muted)}
            className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-sm font-medium transition"
            title={muted ? 'Unmute guest audio' : 'Mute guest audio'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        )}
      </div>
    </header>
  );
}
