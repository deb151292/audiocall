import React, { useState } from 'react';
import CallInterface from './components/CallInterface';

function App() {
  const [userId, setUserId] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = () => {
    if (userId.trim()) setIsJoined(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Audio Call System</h1>
      {!isJoined ? (
        <div className="bg-white p-6 rounded-lg shadow-md w-80">
          <input
            type="text"
            placeholder="Enter your ID"
            className="w-full p-2 border rounded mb-4"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <button
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            onClick={handleJoin}
          >
            Join
          </button>
        </div>
      ) : (
        <CallInterface userId={userId} />
      )}
    </div>
  );
}

export default App;