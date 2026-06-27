export function CompanyLandingPage({
  onStaffTraining,
  onManagerDashboard
}: {
  onStaffTraining: () => void;
  onManagerDashboard: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome</h2>
          <p className="text-xl text-gray-600">Select what you'd like to do</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          {/* Staff Training Option */}
          <button
            onClick={onStaffTraining}
            className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Staff Training</h3>
            <p className="text-gray-600 mb-4">Sign in to practise real guest conversations and get instant coaching.</p>
            <div className="text-blue-600 font-semibold">Start Training →</div>
          </button>

          {/* Manager Dashboard Option */}
          <button
            onClick={onManagerDashboard}
            className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition border-2 border-transparent hover:border-green-500"
          >
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Manager's Dashboard</h3>
            <p className="text-gray-600 mb-4">Manage your team, register staff, and monitor training progress.</p>
            <div className="text-green-600 font-semibold">Enter PIN →</div>
          </button>
        </div>
      </div>
    </div>
  );
}

