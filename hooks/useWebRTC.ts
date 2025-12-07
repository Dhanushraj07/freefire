import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { User } from '../types';

const rtcConfig = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};

export interface Peer {
    userId: string;
    stream: MediaStream;
    isMuted: boolean;
}

export const useWebRTC = (roomId: string, currentUser: User) => {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');

    const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
    const localStreamRef = useRef<MediaStream | null>(null);
    const unsubscribes = useRef<(() => void)[]>([]);

    // Initialize local stream
    useEffect(() => {
        const initLocalStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                localStreamRef.current = stream;
                setLocalStream(stream);
                setConnectionStatus('connected');
            } catch (error) {
                console.error("Error accessing microphone:", error);
                setConnectionStatus('failed');
            }
        };

        initLocalStream();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const createPeerConnection = (remoteUserId: string, shouldCreateOffer: boolean) => {
        if (peerConnections.current[remoteUserId]) return peerConnections.current[remoteUserId];

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnections.current[remoteUserId] = pc;

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setPeers(prev => {
                if (prev.some(p => p.userId === remoteUserId)) return prev;
                return [...prev, { userId: remoteUserId, stream: remoteStream, isMuted: false }];
            });
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                db.collection('voiceRooms').doc(roomId)
                    .collection('participants').doc(remoteUserId)
                    .collection('candidates').add({
                        from: currentUser.id,
                        candidate: event.candidate.toJSON()
                    });
            }
        };

        if (shouldCreateOffer) {
            const createOffer = async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    await db.collection('voiceRooms').doc(roomId)
                        .collection('participants').doc(remoteUserId)
                        .collection('offers').add({
                            from: currentUser.id,
                            offer: { type: offer.type, sdp: offer.sdp }
                        });
                } catch (err) {
                    console.error("Error creating offer:", err);
                }
            };
            createOffer();
        }

        return pc;
    };

    // Join the room and handle signaling
    useEffect(() => {
        if (!localStream || !currentUser || !roomId) return;

        const joinRoom = async () => {
            const roomRef = db.collection('voiceRooms').doc(roomId);
            const participantRef = roomRef.collection('participants').doc(currentUser.id);

            // Add user to participants
            await participantRef.set({
                uid: currentUser.id,
                displayName: currentUser.name,
                photoURL: currentUser.avatarUrl,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Listen for other participants
            const unsubscribeParticipants = roomRef.collection('participants').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        const remoteUserId = data.uid;

                        if (remoteUserId === currentUser.id) return;

                        // The one with the larger ID offers to the one with the smaller ID
                        if (currentUser.id > remoteUserId) {
                            createPeerConnection(remoteUserId, true);
                        }
                    }
                    if (change.type === 'removed') {
                        const remoteUserId = change.doc.id;
                        if (peerConnections.current[remoteUserId]) {
                            peerConnections.current[remoteUserId].close();
                            delete peerConnections.current[remoteUserId];
                            setPeers(prev => prev.filter(p => p.userId !== remoteUserId));
                        }
                    }
                });
            });
            unsubscribes.current.push(unsubscribeParticipants);

            // Listen for incoming offers
            const unsubscribeOffers = participantRef.collection('offers').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        const remoteUserId = data.from;
                        const offer = data.offer;

                        const pc = peerConnections.current[remoteUserId] || createPeerConnection(remoteUserId, false);

                        try {
                            if (pc.signalingState !== "stable") {
                                // If we are already connecting, we might have a glare condition.
                                // But with the ID check, this shouldn't happen ideally.
                                // However, if it does, we need to handle it.
                                // For now, let's assume the ID check prevents glare.
                            }

                            await pc.setRemoteDescription(new RTCSessionDescription(offer));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);

                            // Send answer
                            const remoteParticipantRef = roomRef.collection('participants').doc(remoteUserId);
                            await remoteParticipantRef.collection('answers').add({
                                from: currentUser.id,
                                answer: { type: answer.type, sdp: answer.sdp }
                            });
                        } catch (err) {
                            console.error("Error handling offer:", err);
                        }
                    }
                });
            });
            unsubscribes.current.push(unsubscribeOffers);

            // Listen for incoming answers
            const unsubscribeAnswers = participantRef.collection('answers').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        const remoteUserId = data.from;
                        const answer = data.answer;

                        const pc = peerConnections.current[remoteUserId];
                        if (pc && pc.signalingState === 'have-local-offer') {
                            try {
                                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                            } catch (err) {
                                console.error("Error setting remote description (answer):", err);
                            }
                        }
                    }
                });
            });
            unsubscribes.current.push(unsubscribeAnswers);

            // Listen for ICE candidates
            const unsubscribeCandidates = participantRef.collection('candidates').onSnapshot(snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        const remoteUserId = data.from;
                        const candidate = data.candidate;

                        const pc = peerConnections.current[remoteUserId];
                        if (pc) {
                            try {
                                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                            } catch (err) {
                                console.error("Error adding ice candidate:", err);
                            }
                        }
                    }
                });
            });
            unsubscribes.current.push(unsubscribeCandidates);
        };

        joinRoom();

        return () => {
            // Cleanup
            unsubscribes.current.forEach(u => u());
            unsubscribes.current = [];

            Object.values(peerConnections.current).forEach(pc => pc.close());
            peerConnections.current = {};

            // Remove self from participants
            db.collection('voiceRooms').doc(roomId).collection('participants').doc(currentUser.id).delete();
        };
    }, [localStream, currentUser, roomId]);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const newMuted = !isMuted;
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !newMuted);
            setIsMuted(newMuted);
        }
    };

    return { localStream, peers, isMuted, toggleMute, connectionStatus };
};
