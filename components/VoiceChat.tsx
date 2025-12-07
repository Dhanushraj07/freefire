
import React, { useState, useEffect, useRef } from 'react';
import { RoomMatch, User, BasicUserInfo, RoomOwner } from '../types';
import { MicIcon } from './icons/MicIcon';
import { MicOffIcon } from './icons/MicOffIcon';
import { PhoneXMarkIcon } from './icons/PhoneXMarkIcon';
import { useWebRTC, Peer } from '../hooks/useWebRTC';

interface VoiceChatProps {
    room: RoomMatch;
    currentUser: User;
    onLeave: () => void;
}

const PlayerCard: React.FC<{ player: BasicUserInfo | RoomOwner, isMuted: boolean, isSpeaking: boolean, isCurrentUser: boolean, isConnected: boolean }> = ({ player, isMuted, isSpeaking, isCurrentUser, isConnected }) => {
    return (
        <div className={`relative flex flex-col items-center justify-center gap-2 bg-dark-3 p-4 rounded-lg text-center ${!isConnected ? 'opacity-50' : ''}`}>
            <div className={`relative w-24 h-24 rounded-full border-4 transition-all duration-200 ${isSpeaking && !isMuted ? 'border-green-400 shadow-lg shadow-green-400/30' : 'border-dark-4'}`}>
                <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-full object-cover" />
                {isCurrentUser && (
                    <div className="absolute -bottom-2 right-0 bg-dark-4 p-1 rounded-full">
                        {isMuted ? <MicOffIcon className="w-5 h-5 text-red-400" /> : <MicIcon className="w-5 h-5 text-green-400" />}
                    </div>
                )}
            </div>
            <p className="font-semibold text-white truncate w-full">{player.name}</p>
            {isCurrentUser && <p className="text-xs text-light-2">(You)</p>}
            {!isConnected && !isCurrentUser && <p className="text-xs text-yellow-500">Connecting...</p>}
        </div>
    );
};


const VoiceChat: React.FC<VoiceChatProps> = ({ room, currentUser, onLeave }) => {
    const { peers, localStream, isMuted, toggleMute, connectionStatus } = useWebRTC(room.id, currentUser);
    const [activeSpeakers, setActiveSpeakers] = useState<Record<string, boolean>>({});

    // Audio Level Detection (Simplified)
    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const analysers: Record<string, AnalyserNode> = {};
        const sources: Record<string, MediaStreamAudioSourceNode> = {};

        const checkAudioLevels = () => {
            const newActiveSpeakers: Record<string, boolean> = {};

            // Check local stream
            if (localStream && !isMuted) {
                // Note: Analyzing local stream might cause feedback if not handled carefully, 
                // but for visualization it's fine if we don't output it.
                // For simplicity, we'll skip local visualization or implement it later.
                // Actually, let's try to implement it.
                if (!sources['local']) {
                    sources['local'] = audioContext.createMediaStreamSource(localStream);
                    analysers['local'] = audioContext.createAnalyser();
                    sources['local'].connect(analysers['local']);
                    analysers['local'].fftSize = 256;
                }
                const dataArray = new Uint8Array(analysers['local'].frequencyBinCount);
                analysers['local'].getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                if (average > 10) newActiveSpeakers[currentUser.id] = true;
            }

            // Check peers
            peers.forEach(peer => {
                if (!sources[peer.userId]) {
                    sources[peer.userId] = audioContext.createMediaStreamSource(peer.stream);
                    analysers[peer.userId] = audioContext.createAnalyser();
                    sources[peer.userId].connect(analysers[peer.userId]);
                    analysers[peer.userId].fftSize = 256;
                }
                const dataArray = new Uint8Array(analysers[peer.userId].frequencyBinCount);
                analysers[peer.userId].getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                if (average > 10) newActiveSpeakers[peer.userId] = true;
            });

            setActiveSpeakers(newActiveSpeakers);
            requestAnimationFrame(checkAudioLevels);
        };

        const animationId = requestAnimationFrame(checkAudioLevels);

        return () => {
            cancelAnimationFrame(animationId);
            audioContext.close();
        };
    }, [peers, localStream, isMuted, currentUser.id]);

    // Render audio elements for peers
    useEffect(() => {
        peers.forEach(peer => {
            const audio = document.getElementById(`audio-${peer.userId}`) as HTMLAudioElement;
            if (audio && audio.srcObject !== peer.stream) {
                audio.srcObject = peer.stream;
            }
        });
    }, [peers]);

    const allPlayers = [room.owner, ...room.acceptedPlayers];

    return (
        <div className="max-w-4xl mx-auto bg-dark-2 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b border-dark-4 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Voice Chat</h2>
                    <p className="text-light-2">{room.gameName}</p>
                </div>
                <div className="text-right">
                    {connectionStatus === 'connecting' ? (
                        <p className="text-yellow-400 font-semibold">Connecting...</p>
                    ) : connectionStatus === 'failed' ? (
                        <p className="text-red-400 font-semibold">Connection Failed</p>
                    ) : (
                        <p className="text-green-400 font-semibold">Connected</p>
                    )}
                    <p className="text-sm text-light-2">{peers.length + 1} / {room.maxPlayers} Active</p>
                </div>
            </div>

            {/* Hidden Audio Elements */}
            {peers.map(peer => (
                <audio key={peer.userId} id={`audio-${peer.userId}`} autoPlay playsInline />
            ))}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {allPlayers.map(player => {
                    const isCurrentUser = player.id === currentUser.id;
                    const isConnected = isCurrentUser || peers.some(p => p.userId === player.id);

                    return (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            isMuted={isMuted && isCurrentUser}
                            isSpeaking={!!activeSpeakers[player.id]}
                            isCurrentUser={isCurrentUser}
                            isConnected={isConnected}
                        />
                    );
                })}
            </div>

            <div className="flex items-center justify-center gap-4 bg-dark-1 p-4 rounded-full max-w-xs mx-auto">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition duration-300 ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-dark-4 hover:bg-dark-3'} text-white`}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                </button>
                <button
                    onClick={onLeave}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition duration-300"
                    aria-label="Leave Chat"
                >
                    <PhoneXMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default VoiceChat;
