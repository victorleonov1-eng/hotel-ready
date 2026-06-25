import type { ScoreResult } from '../content/types';

const dimLabels: Record<string, string> = {
  empathy: 'Empathy',
  clarity: 'Clarity',
  toneWarmth: 'Tone & Warmth',
  resolution: 'Resolution',
  outcomeAchieved: 'Outcome',
};

const verdictColors = {
  'floor-ready': 'text-green-600 bg-green-50',
  almost: 'text-amber-600 bg-amber-50',
  'needs-work': 'text-red-600 bg-red-50',
};

const verdictLabels = {
  'floor-ready': 'Floor Ready',
  almost: 'Almost There',
  'needs-work': 'Needs Work',
};

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function ScoreCard({
  result,
  seconds,
  bestTime,
  onRetry,
  onBack,
}: {
  result: ScoreResult;
  seconds: number;
  bestTime?: number;
  onRetry: () => void;
  onBack: () => void;
}) {
  const isBestTime = !bestTime || seconds < bestTime;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-crimson">{result.overall}</div>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${verdictColors[result.verdict]}`}>
          {verdictLabels[result.verdict]}
        </span>
      </div>

      <div className="bg-white border rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-crimson-dark text-sm mb-3">Performance breakdown</h4>
        {Object.entries(result.dimensions).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-600 w-24">{dimLabels[key] || key}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className="bg-teal h-2 rounded-full transition-all"
                style={{ width: `${(val / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-6 text-right">{val}/5</span>
          </div>
        ))}
      </div>

      <div className="bg-teal-light border border-teal/20 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-teal text-sm">Time</h4>
          <span className="text-sm font-bold text-teal">{formatTime(seconds)}</span>
        </div>
        {isBestTime && (
          <div className="text-xs font-semibold text-teal bg-white/50 px-2 py-1 rounded inline-block">
            ✨ Best time achieved!
          </div>
        )}
        {bestTime && !isBestTime && (
          <div className="text-xs text-gray-600">
            Your best: {formatTime(bestTime)}
          </div>
        )}
      </div>

      <div className="bg-teal-light border border-teal/20 rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-teal text-sm mb-2">Coaching</h4>
        <ul className="space-y-2">
          {result.coaching.map((c, i) => (
            <li key={i} className="text-sm text-gray-700">{c}</li>
          ))}
        </ul>
      </div>

      <div className="bg-crimson-light border border-crimson/20 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-crimson text-sm mb-1">One thing to focus on</h4>
        <p className="text-sm text-gray-700">{result.oneThingToFix}</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 bg-crimson text-white py-3 rounded-xl font-medium">
          Try again
        </button>
        <button onClick={onBack} className="flex-1 border border-gray-300 py-3 rounded-xl font-medium text-gray-700">
          Back to scenarios
        </button>
      </div>
    </div>
  );
}
