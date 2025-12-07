
import React, { useState, useEffect } from 'react';
import { MatchType, SkillLevel, Region, User, RoomMatch } from '../types';

interface CreateRoomFormProps {
  currentUser: User;
  onRoomCreated: (newRoomData: Omit<RoomMatch, 'id' | 'owner' | 'acceptedPlayers' | 'createdAt'>) => Promise<void>;
}

const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ currentUser, onRoomCreated }) => {
  const [gameName, setGameName] = useState('Free Fire');
  const [roomId, setRoomId] = useState('');
  const [matchType, setMatchType] = useState<MatchType>(MatchType.SQUAD);
  const [region, setRegion] = useState<Region>(Region.NA);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.INTERMEDIATE);
  const [startTime, setStartTime] = useState('');
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    switch (matchType) {
        case MatchType.SOLO:
            setMaxPlayers(2); // For 1v1 matches
            break;
        case MatchType.DUO:
            setMaxPlayers(2);
            break;
        case MatchType.SQUAD:
            setMaxPlayers(4);
            break;
        default:
            setMaxPlayers(4);
    }
  }, [matchType]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Reset error
    if (!gameName || !roomId || !startTime || !password) {
      setError("Please fill all required fields.");
      return;
    }
    setIsSubmitting(true);
    
    const startDateTime = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    if (startDateTime < new Date()) {
      startDateTime.setDate(startDateTime.getDate() + 1);
    }
    
    const newRoom = {
      gameName,
      roomId,
      matchType,
      region,
      skillLevel,
      startTime: startDateTime,
      password,
      maxPlayers,
    };

    try {
        await onRoomCreated(newRoom as any);
    } catch (err: any) {
        console.error("Error creating room:", err);
        let message = "Failed to create room. Please try again later.";
        if (err.code === 'permission-denied') {
            message = "Permission Denied: You cannot create a room. Please check your account permissions and Firestore security rules.";
        } else if (err.message) {
            message = err.message;
        }
        setError(message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-dark-2 p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-white mb-6">Create New Room Match</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-light-2 mb-2">Game Name</label>
            <input type="text" value={gameName} onChange={e => setGameName(e.target.value)} required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-light-2 mb-2">Room ID</label>
            <input type="text" value={roomId} onChange={e => setRoomId(e.target.value)} required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-medium text-light-2 mb-2">Match Type</label>
              <select value={matchType} onChange={e => setMatchType(e.target.value as MatchType)} className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                {Object.values(MatchType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-light-2 mb-2">Region</label>
              <select value={region} onChange={e => setRegion(e.target.value as Region)} className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-light-2 mb-2">Skill Level</label>
              <select value={skillLevel} onChange={e => setSkillLevel(e.target.value as SkillLevel)} className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                {Object.values(SkillLevel).map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-light-2 mb-2">Max Players</label>
              <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} min="2" max="16" required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-light-2 mb-2">Start Time</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-light-2 mb-2">Room Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        
        {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}

        <div className="pt-4">
          <button type="submit" disabled={isSubmitting} className="w-full bg-brand-primary hover:bg-opacity-90 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-wait">
            {isSubmitting ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoomForm;
