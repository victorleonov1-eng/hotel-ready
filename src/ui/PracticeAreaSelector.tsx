import type { ScenarioPack, UserProfile } from '../content/types';

type PracticeSelectorProps = {
  packs: ScenarioPack[];
  profile: UserProfile;
  onSelect: (packId: string) => void;
  onLogout: () => void;
  onManagerView?: () => void;
};

export function PracticeAreaSelector({ packs, profile, onSelect, onLogout, onManagerView }: PracticeSelectorProps) {
  const isManagerOrGM = profile.department === 'GM' || profile.department === 'MANAGER';

  const matchesDepartment = (packDept: string): boolean => {
    if (isManagerOrGM) return true;
    // Map pack department names to user profile department names
    const packDeptMap: Record<string, string> = {
      'Front Desk / Reception': 'Front Office',
      'Food & Beverage Service': 'Food & Beverage',
      'Housekeeping': 'Housekeeping',
      'Room Service': 'Room Service',
      'Concierge': 'Concierge'
    };
    return packDeptMap[packDept] === profile.department;
  };
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-crimson-dark">Choose a Practice Area</h2>
        <div className="flex items-center gap-3">
          {isManagerOrGM && onManagerView && (
            <button
              onClick={onManagerView}
              className="text-sm text-gray-400 underline"
            >
              👥 Manager view
            </button>
          )}
          <button onClick={onLogout} className="text-sm text-gray-400 underline">
            Sign out
          </button>
        </div>
      </div>
      <p className="text-gray-600 mb-6">Pick a department to practise with real guest scenarios.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packs.map((pack) => {
          const isAccessible = matchesDepartment(pack.department);
          return (
            <button
              key={pack.id}
              onClick={() => isAccessible && onSelect(pack.id)}
              disabled={!isAccessible}
              className={`text-left rounded-xl p-6 transition-all ${
                isAccessible
                  ? 'bg-white border-2 border-gray-200 hover:border-crimson hover:shadow-lg cursor-pointer'
                  : 'bg-gray-100 border-2 border-gray-200 opacity-50 blur-sm cursor-not-allowed'
              }`}
            >
              <h3 className={`text-lg font-bold mb-1 ${isAccessible ? 'text-crimson-dark' : 'text-gray-400'}`}>
                {pack.department}
              </h3>
              <p className={`text-sm mb-4 ${isAccessible ? 'text-gray-600' : 'text-gray-400'}`}>
                {pack.scenarios.length} scenarios
              </p>
              <div className={`text-xs font-semibold ${isAccessible ? 'text-teal' : 'text-gray-400'}`}>
                {pack.scenarios.map((s) => s.skills).flat().length} skills to master
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
