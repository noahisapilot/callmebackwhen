import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calls" element={<CallsPage />} />
        <Route path="/calls/new" element={<NewCallPage />} />
        <Route path="/calls/:id" element={<CallDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

// Placeholder pages - to be implemented
function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold text-primary-600 mb-4">
        CallMeBackWhen
      </h1>
      <p className="text-gray-600 text-center mb-8">
        Your AI personal secretary that waits on hold for you
      </p>
      <a
        href="/calls/new"
        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
      >
        Make a Call
      </a>
    </div>
  );
}

function CallsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Calls</h1>
      <p className="text-gray-600">No calls yet. Start your first call!</p>
    </div>
  );
}

function NewCallPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">New Call</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Who are you calling? (optional)
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Comcast Support"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What's the purpose of this call?
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="e.g., Cancel my subscription"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Start Call
        </button>
      </form>
    </div>
  );
}

function CallDetailPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Call Details</h1>
      <p className="text-gray-600">Call information will appear here.</p>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-gray-600">Settings will appear here.</p>
    </div>
  );
}

export default App;
