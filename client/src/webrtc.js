let ws = null;
let pc = null;
let localStream = null;
let currentCalleeId = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 2000;

function connectWebSocket(userId, setCallStatus) {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(`ws://194.164.149.68:8080/ws?id=${userId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts = 0;
      resolve();
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setCallStatus('Error');
      reject(new Error('Failed to connect to WebSocket server'));
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setCallStatus('Disconnected');
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
        setTimeout(() => {
          connectWebSocket(userId, setCallStatus)
            .then(resolve)
            .catch(reject);
        }, reconnectDelay);
      } else {
        console.error('Max reconnect attempts reached');
        setCallStatus('Error');
        reject(new Error('Unable to reconnect to WebSocket server'));
      }
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('Received message:', msg);
        switch (msg.type) {
          case 'offer':
            await handleOffer(msg);
            setCallStatus('Connected');
            currentCalleeId = msg.from;
            break;
          case 'answer':
            await handleAnswer(msg);
            setCallStatus('Connected');
            break;
          case 'ice-candidate':
            await handleIceCandidate(msg);
            break;
          default:
            console.warn('Unknown message type:', msg.type);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
  });
}

export async function initWebRTC(userId, setCallStatus) {
  try {
    await connectWebSocket(userId, setCallStatus);

    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && currentCalleeId) {
        try {
          ws.send(JSON.stringify({
            type: 'ice-candidate',
            to: currentCalleeId,
            data: event.candidate,
          }));
        } catch (err) {
          console.error('ICE candidate send error:', err);
        }
      } else if (event.candidate && !currentCalleeId) {
        console.warn('No callee ID for ICE candidate');
      }
    };

    pc.ontrack = (event) => {
      try {
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play().catch(err => {
          console.error('Audio play error:', err);
          if (err.name === 'NotAllowedError') {
            alert('Please interact with the page to enable audio playback');
          }
        });
      } catch (err) {
        console.error('Track error:', err);
      }
    };

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    setCallStatus('Initialized');
  } catch (err) {
    console.error('WebRTC init error:', err);
    setCallStatus('Error');
    throw err;
  }
}

export async function startCall(calleeId) {
  try {
    if (!pc) throw new Error('RTCPeerConnection is not initialized');
    if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error('WebSocket is not connected');
    currentCalleeId = calleeId;
    const offer = await pc.createOffer();
    console.log('Offer SDP:', offer.sdp);
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({
      type: 'offer',
      to: calleeId,
      data: offer,
    }));
  } catch (err) {
    console.error('Start call error:', err);
    throw err;
  }
}

export function endCall() {
  try {
    if (pc) {
      pc.close();
      pc = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
      ws = null;
    }
    currentCalleeId = null;
  } catch (err) {
    console.error('End call error:', err);
  }
}

export function cleanupWebRTC() {
  endCall();
}

async function handleOffer(msg) {
  try {
    if (!pc) {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pc.onicecandidate = (event) => {
        if (event.candidate && currentCalleeId) {
          try {
            ws.send(JSON.stringify({
              type: 'ice-candidate',
              to: currentCalleeId,
              data: event.candidate,
            }));
          } catch (err) {
            console.error('ICE candidate send error:', err);
          }
        }
      };
      pc.ontrack = (event) => {
        try {
          const remoteAudio = new Audio();
          remoteAudio.srcObject = event.streams[0];
          remoteAudio.play().catch(err => {
            console.error('Audio play error:', err);
            if (err.name === 'NotAllowedError') {
              alert('Please interact with the page to enable audio playback');
            }
          });
        } catch (err) {
          console.error('Track error:', err);
        }
      };
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }
    await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({
      type: 'answer',
      to: msg.from,
      data: answer,
    }));
  } catch (err) {
    console.error('Handle offer error:', err);
  }
}

async function handleAnswer(msg) {
  try {
    if (!pc) throw new Error('RTCPeerConnection is not initialized');
    await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
  } catch (err) {
    console.error('Handle answer error:', err);
  }
}

async function handleIceCandidate(msg) {
  try {
    if (!pc) throw new Error('RTCPeerConnection is not initialized');
    await pc.addIceCandidate(new RTCIceCandidate(msg.data));
  } catch (err) {
    console.error('Handle ICE candidate error:', err);
  }
}