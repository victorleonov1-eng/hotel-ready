import type { UserProfile } from '../content/types';

type Props = {
  profile: UserProfile;
  packId: string;
  scenarios: any[];
  onSelect: (scenarioId: string) => void;
  onManager: () => void;
  onBack: () => void;
};

export function ScenarioList({ profile, scenarios, onSelect, onManager, onBack }: Props) {
  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-crimson underline">
          &larr; Back
        </button>
        <div className="flex gap-2">
          <button onClick={onManager} className="text-sm text-teal underline">
            Manager view
          </button>
          <button onClick={onBack} className="text-sm text-gray-400 underline">
            Sign out
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-bold text-crimson-dark">
          {profile.firstName} {profile.lastName}
        </h2>
        <p className="text-sm text-gray-500">Pick a scenario to practise</p>
      </div>

      <div className="space-y-3">
        {scenarios.map((s) => {
          const bestScore = profile.bestByScenario[s.id];
          const bestTime = profile.bestTimeByScenario[s.id];
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-crimson transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-crimson-dark text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{s.skills.join(' · ')}</p>
                  <p className="text-xs text-teal mt-0.5">{s.businessOutcome}</p>
                </div>
                <div className="ml-2 shrink-0">
                  {bestScore !== undefined && (
                    <div className="text-right">
                      <div className="text-xs font-semibold text-teal">Score</div>
                      <div className="text-sm font-bold text-teal">{bestScore}</div>
                    </div>
                  )}
                  {bestTime !== undefined && (
                    <div className="text-right mt-1">
                      <div className="text-xs font-semibold text-gray-600">Time</div>
                      <div className="text-sm font-bold text-gray-700">{Math.round(bestTime)}s</div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
