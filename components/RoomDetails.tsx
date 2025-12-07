

import React, { useState, useEffect } from 'react';
import { RoomMatch, User, JoinRequest, RequestStatus, RoomOwner } from '../types';
import { format } from 'date-fns';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { StarIcon } from './icons/StarIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { db } from '../firebase';
// FIX: Use v8 compat imports to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { TrashIcon } from './icons/TrashIcon';
import { MicIcon } from './icons/MicIcon';


interface RoomDetailsProps {
  room: RoomMatch;
  currentUser: User;
  viewProfile: (user: User | RoomOwner) => Promise<void>;
  onSendRequest: (roomId: string, ownerId: string) => Promise<void>;
  onUpdateRequest: (roomId: string, requestId: string, status: RequestStatus) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onJoinVoiceChat: (room: RoomMatch) => void;
}

const RequestManagement: React.FC<{
  requests: JoinRequest[];
  onUpdateRequest: (requestId: string, status: RequestStatus) => void;
}> = ({ requests, onUpdateRequest }) => {
  const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING);
  if (pendingRequests.length === 0) return <p className="text-light-2">No pending join requests.</p>;

  return (
    <div className="space-y-3">
      {pendingRequests.map(req => (
        <div key={req.id} className="flex items-center justify-between bg-dark-3 p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <img src={req.user.avatarUrl} alt={req.user.name} className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-semibold text-white">{req.user.name}</p>
              <p className="text-xs text-light-2">{req.user.inGameId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onUpdateRequest(req.id, RequestStatus.ACCEPTED)} className="p-2 text-green-400 hover:text-green-300 transition-colors"><CheckCircleIcon /></button>
            <button onClick={() => onUpdateRequest(req.id, RequestStatus.REJECTED)} className="p-2 text-red-400 hover:text-red-300 transition-colors"><XCircleIcon /></button>
          </div>
        </div>
      ))}
    </div>
  );
};


const RoomDetails: React.FC<RoomDetailsProps> = ({ room, currentUser, viewProfile, onSendRequest, onUpdateRequest, onDeleteRoom, onJoinVoiceChat }) => {
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [requestsError, setRequestsError] = useState<string | null>(null);

    useEffect(() => {
        if (!room) return;
        
        setIsLoadingRequests(true);
        setRequestsError(null);

        const isOwner = room.owner.id === currentUser.id;
        
        let requestsQuery;

        if (isOwner) {
            // Owner can fetch all requests for the room they own
            requestsQuery = db.collection("joinRequests")
                .where("roomId", "==", room.id)
                .where("roomOwnerId", "==", currentUser.id)
                .orderBy("createdAt", "desc");
        } else {
            // Other users can only fetch their own request for this room
            requestsQuery = db.collection("joinRequests")
                .where("roomId", "==", room.id)
                .where("user.id", "==", currentUser.id);
        }

        const unsubscribe = requestsQuery.onSnapshot((snapshot) => {
            const fetchedRequests = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as firebase.firestore.Timestamp).toDate(),
                // FIX: Cast to unknown first to satisfy TypeScript's type overlap requirement.
                } as unknown as JoinRequest
            });
            setRequests(fetchedRequests);
            setRequestsError(null); // Clear any previous errors on successful fetch
            setIsLoadingRequests(false);
        }, (err: any) => {
            console.error("Failed to fetch join requests:", err);
            let message = "Failed to fetch join requests.";
            let keepLoading = false;

            if (err.code === 'permission-denied') {
                message = "Failed to fetch join requests: Missing or insufficient permissions. This is likely due to Firestore security rules not allowing you to view join requests for this room.";
            } else if (err.code === 'failed-precondition') {
                 if (err.message && err.message.includes('building')) {
                    message = `The database index for join requests is being prepared. This may take a few minutes. The list will load automatically when it's ready.`;
                    keepLoading = true; // Keep showing the loading state
                } else {
                    message = "Could not fetch requests. This query requires a custom index. Please check the developer console (F12) for a link to create the necessary Firestore index.";
                }
            }
            setRequestsError(message);
            if (!keepLoading) {
                setIsLoadingRequests(false);
            }
        });

        return () => unsubscribe();
    }, [room.id, currentUser.id]);

    const isOwner = room.owner.id === currentUser.id;
    const userRequest = requests.find(r => r.user.id === currentUser.id);
    const hasRequested = !!userRequest && userRequest.status !== RequestStatus.REJECTED;
    const isAccepted = room.acceptedPlayers.some(p => p.id === currentUser.id);
    const isRoomFull = room.acceptedPlayers.length + 1 >= room.maxPlayers;

    const handleSendRequest = () => {
        if (hasRequested) return;
        onSendRequest(room.id, room.owner.id);
    };

    const handleUpdateRequest = (requestId: string, status: RequestStatus) => {
        onUpdateRequest(room.id, requestId, status);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to permanently delete this room? This action cannot be undone.')) {
            onDeleteRoom(room.id);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-dark-2 p-6 rounded-lg shadow-lg space-y-6">
                <div>
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-white">{room.gameName} - {room.matchType}</h2>
                        <span className="px-3 py-1 text-sm font-semibold rounded-full text-white bg-brand-primary">{room.skillLevel}</span>
                    </div>
                    <p className="text-light-2">Hosted by <span onClick={() => viewProfile(room.owner)} className="text-brand-secondary font-semibold cursor-pointer hover:underline">{room.owner.name}</span></p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-dark-3 p-3 rounded-lg">
                        <p className="text-sm text-light-2">Room ID</p>
                        <p className="font-bold text-lg text-white font-mono">{room.roomId}</p>
                    </div>
                    <div className="bg-dark-3 p-3 rounded-lg">
                        <p className="text-sm text-light-2">Region</p>
                        <p className="font-bold text-lg text-white">{room.region}</p>
                    </div>
                    <div className="bg-dark-3 p-3 rounded-lg">
                        <p className="text-sm text-light-2">Start Time</p>
                        {/* FIX: Removed unnecessary cast as `room.startTime` is now correctly typed as Date. */}
                        <p className="font-bold text-lg text-white">{format(room.startTime, 'p')}</p>
                    </div>
                </div>

                { (isOwner || isAccepted) && (
                    <>
                        <div className="bg-dark-3 p-4 rounded-lg text-center">
                            <p className="text-sm text-light-2">Room Password</p>
                            <p className="font-bold text-2xl text-brand-primary tracking-widest font-mono select-all">{room.password}</p>
                            <p className="text-xs text-gray-400 mt-1">This is confidential. Do not share.</p>
                        </div>
                         <div className="mt-6">
                            <button
                                onClick={() => onJoinVoiceChat(room)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                            >
                                <MicIcon className="w-5 h-5" />
                                Join Voice Chat
                            </button>
                        </div>
                    </>
                )}
                
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white border-b-2 border-dark-3 pb-2">Players ({room.acceptedPlayers.length + 1} / {room.maxPlayers})</h3>
                    <div className="flex flex-wrap gap-4">
                        {[room.owner, ...room.acceptedPlayers].map(player => (
                            <div key={player.id} onClick={() => viewProfile(player)} className="flex items-center gap-3 bg-dark-3 p-2 rounded-lg cursor-pointer">
                                <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-white flex items-center gap-1">{player.name} {player.isVerified && <ShieldCheckIcon className="w-4 h-4 text-brand-secondary"/>}</p>
                                    {'reputation' in player &&
                                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                                        <StarIcon className="w-3 h-3"/> 
                                        {/* FIX: Cast player to User to satisfy TypeScript, as the 'in' operator has already confirmed the type. */}
                                        {(player as User).reputation.toFixed(1)}
                                    </div>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {isOwner && (
                    <>
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b-2 border-dark-3 pb-2">Join Requests ({requests.filter(r => r.status === RequestStatus.PENDING).length})</h3>
                        {isLoadingRequests ? (
                          <div className="text-center p-4">
                            <p className="text-light-2">Loading requests...</p>
                            {requestsError && requestsError.includes('database index') && <p className="text-yellow-400 text-sm mt-2 bg-yellow-500/10 p-2 rounded-md">{requestsError}</p>}
                          </div>
                        ) : requestsError ? (
                          <p className="text-red-400 p-3 bg-red-500/10 rounded-md">{requestsError}</p>
                        ) : (
                          <RequestManagement requests={requests} onUpdateRequest={handleUpdateRequest} />
                        )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-dark-4">
                        <h3 className="text-xl font-semibold text-white mb-4">Danger Zone</h3>
                        <button
                            onClick={handleDelete}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                        >
                            <TrashIcon className="w-5 h-5" />
                            Delete Room Permanently
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-2">This action cannot be undone.</p>
                    </div>
                    </>
                )}

                 {!isOwner && !isAccepted && (
                    <button 
                        onClick={handleSendRequest} 
                        disabled={hasRequested || isRoomFull}
                        className="w-full bg-brand-secondary text-dark-1 font-bold py-3 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90">
                        {isRoomFull ? 'Room Full' : (userRequest?.status === RequestStatus.PENDING ? 'Request Sent' : 'Request to Join')}
                    </button>
                )}
            </div>

            <div className="bg-dark-2 p-6 rounded-lg shadow-lg flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><ChatBubbleIcon /> Match Chat</h3>
                <div className="flex-grow bg-dark-3 p-4 rounded-lg space-y-4 overflow-y-auto h-96">
                    {/* Mock Chat */}
                    <div className="flex gap-2">
                        <img src={room.owner.avatarUrl} className="w-8 h-8 rounded-full" />
                        <div>
                            <p className="font-bold text-sm text-brand-secondary">{room.owner.name}</p>
                            <p className="bg-dark-4 p-2 rounded-lg text-sm">Room is up! First come, first serve. Good luck everyone!</p>
                        </div>
                    </div>
                     {isAccepted && 
                        <div className="flex gap-2 flex-row-reverse">
                            <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full" />
                            <div className="text-right">
                                <p className="font-bold text-sm text-brand-primary">{currentUser.name}</p>
                                <p className="bg-brand-primary bg-opacity-80 p-2 rounded-lg text-sm text-white">Hey, I'm in! Let's go!</p>
                            </div>
                        </div>
                    }
                     {room.acceptedPlayers[0] && (
                        <div className="flex gap-2">
                            <img src={room.acceptedPlayers[0].avatarUrl} className="w-8 h-8 rounded-full" />
                            <div>
                                <p className="font-bold text-sm text-brand-secondary">{room.acceptedPlayers[0].name}</p>
                                <p className="bg-dark-4 p-2 rounded-lg text-sm">Can't wait for this match!</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex gap-2">
                    <input type="text" placeholder="Type a message..." className="flex-grow bg-dark-3 border-dark-4 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    <button className="bg-brand-primary p-2 rounded-lg text-white">Send</button>
                </div>
            </div>
        </div>
    );
};

export default RoomDetails;
