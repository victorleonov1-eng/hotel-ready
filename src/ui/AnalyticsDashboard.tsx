import { loadProfiles, findProfile } from '../state/profiles';
import { getAllScenarios } from '../content/registry';
import type { UserProfile } from '../content/types';

export function AnalyticsDashboard() {
  const profiles = loadProfiles();
  const scenarios = getAllScenarios();

  // Team statistics
  const totalAttempts = profiles.reduce((sum, p) => sum + p.attempts.length, 0);
  const avgScore =
    totalAttempts > 0
      ? Math.round(
          profiles.reduce((sum, p) => sum + p.attempts.reduce((s, a) => s + a.score, 0), 0) / totalAttempts
        )
      : 0;

  // Per staff metrics
  const staffMetrics = profiles
    .map((p) => {
      const attempts = p.attempts;
      const scores = attempts.map((a) => a.score);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const best = scores.length ? Math.max(...scores) : 0;
      const improvementRate =
        attempts.length > 1
          ? Math.round(((scores[scores.length - 1] - scores[0]) / scores[0]) * 100)
          : 0;
      return {
        name: `${p.firstName} ${p.lastName}`,
        attempts: attempts.length,
        avgScore: avg,
        bestScore: best,
        improvement: improvementRate,
        lastAttempt: attempts[attempts.length - 1]?.score,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

  // Scenario difficulty (average score per scenario)
  const scenarioDifficulty = scenarios
    .map((s) => {
      const scores = profiles.flatMap((p) => p.attempts.filter((a) => a.scenarioId === s.id).map((a) => a.score));
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return {
        title: s.title,
        avgScore: avg,
        attempts: scores.length,
        difficulty: avg ? (avg < 60 ? '🔴 Hard' : avg < 75 ? '🟡 Moderate' : '🟢 Easier') : '⚪ Untested',
      };
    })
    .filter((s) => s.attempts > 0)
    .sort((a, b) => (a.avgScore ?? 0) - (b.avgScore ?? 0));

  // Top performers
  const topPerformers = staffMetrics.slice(0, 3);

  // Needs improvement
  const needsImprovement = staffMetrics.filter((m) => m.avgScore < 65).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-gray-600 text-sm font-semibold">Total Attempts</div>
          <div className="text-3xl font-bold text-crimson mt-2">{totalAttempts}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-gray-600 text-sm font-semibold">Team Avg Score</div>
          <div className="text-3xl font-bold text-teal mt-2">{avgScore}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-gray-600 text-sm font-semibold">Staff Members</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{profiles.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-gray-600 text-sm font-semibold">Scenarios Practiced</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {new Set(profiles.flatMap((p) => p.attempts.map((a) => a.scenarioId))).size}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-crimson-dark mb-4">🏆 Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.length === 0 ? (
              <p className="text-sm text-gray-500">No attempts yet</p>
            ) : (
              topPerformers.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-600">{m.attempts} attempts</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-600">{m.avgScore}</div>
                    <div className="text-xs text-gray-600">avg score</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-crimson-dark mb-4">📈 Needs Improvement</h3>
          <div className="space-y-3">
            {needsImprovement.length === 0 ? (
              <p className="text-sm text-gray-500">Everyone is doing great!</p>
            ) : (
              needsImprovement.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-600">{m.attempts} attempts</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-red-600">{m.avgScore}</div>
                    <div className="text-xs text-gray-600">avg score</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scenario Difficulty */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-crimson-dark mb-4">📊 Scenario Difficulty (Avg Scores)</h3>
        <div className="space-y-2">
          {scenarioDifficulty.length === 0 ? (
            <p className="text-sm text-gray-500">No attempts yet</p>
          ) : (
            scenarioDifficulty.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-xs">{s.title}</div>
                  <div className="text-gray-600 text-xs">{s.attempts} attempts</div>
                </div>
                <div className="flex items-center gap-2">
                  {s.avgScore !== null && (
                    <>
                      <div className="font-bold w-8 text-right">{s.avgScore}</div>
                      <div className="w-24 bg-gray-200 rounded h-2">
                        <div
                          className={`h-2 rounded transition-all ${
                            s.avgScore >= 75
                              ? 'bg-green-500'
                              : s.avgScore >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(s.avgScore, 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                  <div className="w-20 text-right">{s.difficulty}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Staff Performance Table */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-crimson-dark mb-4">👥 All Staff Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-gray-700 font-semibold">Name</th>
                <th className="text-center p-2 text-gray-700 font-semibold">Attempts</th>
                <th className="text-center p-2 text-gray-700 font-semibold">Avg Score</th>
                <th className="text-center p-2 text-gray-700 font-semibold">Best Score</th>
                <th className="text-center p-2 text-gray-700 font-semibold">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {staffMetrics.map((m, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-2">{m.name}</td>
                  <td className="text-center p-2">{m.attempts}</td>
                  <td className="text-center p-2 font-bold">{m.avgScore}</td>
                  <td className="text-center p-2 font-bold text-green-600">{m.bestScore}</td>
                  <td className="text-center p-2">
                    {m.improvement > 0 ? (
                      <span className="text-green-600 font-semibold">↑ {m.improvement}%</span>
                    ) : m.improvement < 0 ? (
                      <span className="text-red-600 font-semibold">↓ {Math.abs(m.improvement)}%</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
