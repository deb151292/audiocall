import React, { useEffect, useState } from 'react';
import { initWebRTC, startCall, endCall, cleanupWebRTC } from '../webrtc';

function CallInterface({ userId }) {
  const [calleeId, setCalleeId] = useState('');
  const [callStatus, setCallStatus] = useState('Idle');
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    // Only initialize WebRTC, no automatic call start
    initWebRTC(userId, setCallStatus)
      .then(() => {
        if (isMounted) {
          setIsInitialized(true);
          setCallStatus('Idle');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError('Failed to initialize WebRTC: ' + err.message);
          setCallStatus('Error');
          setIsInitialized(false);
        }
      });

    return () => {
      isMounted = false;
      cleanupWebRTC();
    };
  }, [userId]);

  const handleStartCall = () => {
    if (!calleeId.trim()) {
      setError('Please enter a valid callee ID');
      return;
    }
    if (calleeId === userId) {
      setError('Cannot call yourself');
      return;
    }
    if (!isInitialized) {
      setError('WebRTC is not initialized. Please check backend connection.');
      return;
    }
    setError(null);
    setCallStatus('Calling');
    startCall(calleeId)
      .catch((err) => {
        setError('Failed to start call: ' + err.message);
        setCallStatus('Idle');
      });
  };

  const handleEndCall = () => {
    endCall();
    setCallStatus('Idle');
    setError(null);
    setCalleeId('');
    setIsInitialized(false); // Allow reinitialization
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-80 mx-auto">
      <h2 className="text-xl font-semibold mb-4">Welcome, {userId}</h2>
      {!isInitialized && callStatus !== 'Error' && (
        <p className="text-blue-500 mb-4">Initializing...</p>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="text"
        placeholder="Enter callee ID"
        className="w-full p-2 border rounded mb-4 disabled:bg-gray-100"
        value={calleeId}
        onChange={(e) => setCalleeId(e.target.value)}
        disabled={callStatus === 'Calling' || callStatus === 'Connected'}
      />
      {callStatus !== 'Calling' && callStatus !== 'Connected' ? (
        <button
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          onClick={handleStartCall}
          disabled={!isInitialized}
        >
          Start Call
        </button>
      ) : (
        <button
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
          onClick={handleEndCall}
        >
          End Call
        </button>
      )}
      <p className="mt-4 text-gray-600">Status: {callStatus}</p>
    </div>
  );
}

export default CallInterface;