import type { ScenarioPack } from '../content/types';

type PracticeSelectorProps = {
  packs: ScenarioPack[];
  onSelect: (packId: string) => void;
  onLogout: () => void;
};

export function PracticeAreaSelector({ packs, onSelect, onLogout }: PracticeSelectorProps) {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-crimson-dark">Choose a Practice Area</h2>
        <button onClick={onLogout} className="text-sm text-gray-400 underline">
          Sign out
        </button>
      </div>
      <p className="text-gray-600 mb-6">Pick a department to practise with real guest scenarios.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packs.map((pack) => (
          <button
            key={pack.id}
            onClick={() => onSelect(pack.id)}
            className="text-left bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-crimson hover:shadow-lg transition-all"
          >
            <h3 className="text-lg font-bold text-crimson-dark mb-1">{pack.department}</h3>
            <p className="text-sm text-gray-600 mb-4">{pack.scenarios.length} scenarios</p>
            <div className="text-xs text-teal font-semibold">
              {pack.scenarios.map((s) => s.skills).flat().length} skills to master
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
