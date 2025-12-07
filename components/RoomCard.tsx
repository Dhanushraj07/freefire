import React from 'react';
import { RoomMatch } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { GameControllerIcon } from './icons/GameControllerIcon';
import { UserIcon } from './icons/UserIcon';
import { ClockIcon } from './icons/ClockIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { StarIcon } from './icons/StarIcon';

interface RoomCardProps {
  room: RoomMatch;
  onSelectRoom: (room: RoomMatch) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onSelectRoom }) => {
  const timeUntilStart = formatDistanceToNow(room.startTime, { addSuffix: true });

  const skillColor = {
    Beginner: 'bg-green-500',
    Intermediate: 'bg-blue-500',
    Advanced: 'bg-purple-500',
    Pro: 'bg-red-500',
  };

  return (
    <div 
      onClick={() => onSelectRoom(room)}
      className="bg-dark-2 rounded-lg overflow-hidden shadow-lg hover:shadow-brand-primary/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">{room.gameName}</h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${skillColor[room.skillLevel]}`}>{room.skillLevel}</span>
        </div>
        <p className="text-sm text-brand-secondary font-semibold">{room.matchType}</p>

        <div className="mt-4 space-y-3 text-sm text-light-2">
          <div className="flex items-center gap-3">
            <GameControllerIcon className="w-5 h-5 text-gray-400" />
            <span>Room ID: <span className="font-mono bg-dark-3 px-2 py-1 rounded">{room.roomId}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <span>Starts {timeUntilStart}</span>
          </div>
           <div className="flex items-center gap-3">
            <GlobeIcon className="w-5 h-5 text-gray-400" />
            <span>Region: {room.region}</span>
          </div>
          <div className="flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
                <span>Owner: {room.owner.name}</span>
                {room.owner.isVerified && <ShieldCheckIcon className="w-5 h-5 text-brand-secondary" />}
            </div>
          </div>
        </div>
        
        <div className="mt-5 border-t border-dark-3 pt-4 flex justify-between items-center">
             <div className="flex items-center -space-x-2">
                {[room.owner, ...room.acceptedPlayers].slice(0, 4).map((player, index) => (
                    <img key={player.id} src={player.avatarUrl} alt={player.name} className={`w-8 h-8 rounded-full border-2 border-dark-2 ${index > 0 ? '' : ''}`} />
                ))}
                {room.acceptedPlayers.length + 1 > 4 && (
                    <div className="w-8 h-8 rounded-full bg-dark-4 flex items-center justify-center text-xs font-bold text-light-2 border-2 border-dark-2">
                        +{room.acceptedPlayers.length + 1 - 4}
                    </div>
                )}
            </div>
            <button className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-opacity-90 transition duration-300">
              View Match
            </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;