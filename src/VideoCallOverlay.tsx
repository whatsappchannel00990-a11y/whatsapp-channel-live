import React, { useEffect, useRef, useState } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import { db } from '../services/firebase';
import Button from './Button';

interface VideoCallProps {
  chatId: string;
  currentUser: string;
  isCaller: boolean;
  isVideo: boolean;
  onEndCall: () => void;
}

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

const VideoCallOverlay: React.FC<VideoCallProps> = ({ chatId, currentUser, isCaller, isVideo, onEndCall }) => {
  const [callStatus, setCallStatus] = useState<string>('Initializing...');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;
    
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnection.current = pc;

        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus('Connected');
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
             // Send candidate to Firebase
             const candidateRef = ref(db, `calls/${chatId}/candidates/${currentUser}/${Date.now()}`);
             set(candidateRef, JSON.stringify(event.candidate));
          }
        };

        // Signaling Logic via Firebase
        const callRef = ref(db, `calls/${chatId}`);
        
        if (isCaller) {
          setCallStatus('Calling...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await set(ref(db, `calls/${chatId}/offer`), JSON.stringify(offer));
        }

        // Listen for signaling data
        unsubscribe = onValue(callRef, async (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          if (!isCaller && data.offer && !pc.remoteDescription) {
            setCallStatus('Incoming Call...');
            const offer = JSON.parse(data.offer);
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await set(ref(db, `calls/${chatId}/answer`), JSON.stringify(answer));
          }

          if (isCaller && data.answer && !pc.remoteDescription) {
             const answer = JSON.parse(data.answer);
             await pc.setRemoteDescription(answer);
          }
          
          // Handle Candidates (Simplified for this demo, usually requires separate listener per user)
           if (data.candidates) {
              // Logic to add candidates would go here
              // Iterating through opposite user's candidates
           }
           
           if (data.status === 'ended') {
               onEndCall();
           }
        });

      } catch (err) {
        console.error("Error starting call:", err);
        setCallStatus('Error accessing camera/mic');
      }
    };

    startCall();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (unsubscribe) unsubscribe();
      // Cleanup call data in Firebase
      set(ref(db, `calls/${chatId}`), { status: 'ended' });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, currentUser, isCaller, isVideo, onEndCall]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 text-white z-10">
        <h3 className="text-xl font-bold shadow-black drop-shadow-md">{callStatus}</h3>
      </div>
      
      <div className="relative w-full h-full max-w-4xl flex items-center justify-center p-4">
        {/* Remote Video */}
        {/* If audio only, we might want to show a placeholder, but kept simple for now */}
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover rounded-2xl bg-gray-800 ${!isVideo ? 'hidden' : ''}`}
        />
        {!isVideo && <div className="w-full h-full flex items-center justify-center text-white text-2xl">Audio Call</div>}
        
        {/* Local Video (Picture in Picture) */}
        {isVideo && (
          <div className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-72 bg-black rounded-xl overflow-hidden border-2 border-white shadow-xl">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
            />
          </div>
        )}
      </div>

      <div className="absolute bottom-8 flex gap-6">
        <Button variant="danger" size="lg" onClick={onEndCall} className="rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-red-900/50">
          <i className="fas fa-phone-slash text-2xl"></i>
        </Button>
        <Button variant="secondary" size="lg" className="rounded-full w-16 h-16 flex items-center justify-center bg-gray-600 hover:bg-gray-500">
          <i className="fas fa-microphone-slash text-2xl"></i>
        </Button>
      </div>
    </div>
  );
};

export default VideoCallOverlay;