
import React, { useState } from 'react';
import { RoomMatch, Region, SkillLevel } from '../types';
import RoomCard from './RoomCard';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface RoomListProps {
  rooms: RoomMatch[];
  onSelectRoom: (room: RoomMatch) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onSelectRoom }) => {
  const [filterRegion, setFilterRegion] = useState<Region | 'all'>('all');
  const [filterSkill, setFilterSkill] = useState<SkillLevel | 'all'>('all');

  const filteredRooms = rooms.filter(room => {
    const regionMatch = filterRegion === 'all' || room.region === filterRegion;
    const skillMatch = filterSkill === 'all' || room.skillLevel === filterSkill;
    return regionMatch && skillMatch;
  });

  const hasRooms = rooms.length > 0;
  const hasFilteredRooms = filteredRooms.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-dark-2 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Available Rooms</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value as Region | 'all')}
              className="appearance-none bg-dark-3 border border-dark-4 rounded-md py-2 px-4 pr-8 text-light-1 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Regions</option>
              {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value as SkillLevel | 'all')}
              className="appearance-none bg-dark-3 border border-dark-4 rounded-md py-2 px-4 pr-8 text-light-1 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Skill Levels</option>
              {Object.values(SkillLevel).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
             <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {!hasRooms ? (
        <div className="text-center py-16 bg-dark-2 rounded-lg">
           <h3 className="text-2xl font-bold text-white">No Rooms Available Yet</h3>
           <p className="text-light-2 mt-2">Be the first to create a room and get the match started!</p>
        </div>
      ) : !hasFilteredRooms ? (
        <div className="text-center py-16 bg-dark-2 rounded-lg">
          <p className="text-light-2 text-lg">No rooms match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <RoomCard key={room.id} room={room} onSelectRoom={onSelectRoom} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomList;