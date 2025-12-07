

import React from 'react';
import { User } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const matchesPlayed = user.matchesPlayed ?? 0;
  const wins = user.wins ?? 0;
  const winRate = matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(1) : '0.0';

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.inGameId);
    // Note: A toast notification for "Copied!" could be added here for better UX.
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-dark-2 rounded-lg shadow-lg overflow-hidden">
        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/seed/${user.id}/1200/400)`}}></div>
        <div className="p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-24 sm:-mt-16 sm:space-x-6">
                <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-32 h-32 rounded-full border-4 border-dark-2 bg-dark-2 object-cover"
                />
                <div className="mt-4 sm:mt-0 text-center sm:text-left">
                    <h2 className="text-3xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                        {user.name} 
                        {user.isVerified && <ShieldCheckIcon className="w-7 h-7 text-brand-secondary" />}
                    </h2>
                    <p className="text-light-2">In-Game ID: <span className="font-mono text-brand-secondary">{user.inGameId}</span></p>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                 <div className="bg-dark-3 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-white">{matchesPlayed}</p>
                    <p className="text-sm text-light-2">Matches Played</p>
                </div>
                <div className="bg-dark-3 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-white">{wins}</p>
                    <p className="text-sm text-light-2">Wins</p>
                </div>
                <div className="bg-dark-3 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-white">{winRate}%</p>
                    <p className="text-sm text-light-2">Win Rate</p>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">In-Game Profile</h3>
                <div className="bg-dark-3 p-4 rounded-lg text-center space-y-2">
                    <p className="text-light-2">
                        Search this Game ID in Free Fire to see my full profile.
                    </p>
                    <div className="inline-flex items-center justify-center gap-2 bg-dark-4 p-2 rounded-md">
                        <span className="font-mono text-brand-secondary">{user.inGameId}</span>
                        <button onClick={handleCopyId} className="bg-dark-1 text-light-2 text-xs font-bold px-2 py-1 rounded hover:bg-dark-3 transition-colors" title="Copy ID">
                            COPY
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">Verification Proof</h3>
                <div className="bg-dark-3 p-4 rounded-lg">
                    <p className="text-light-2">
                        {user.isVerified 
                            ? "This user has been verified by the SquadMatch team."
                            : "This user has not submitted verification proof yet."
                        }
                    </p>
                    {user.isVerified && (
                        <div className="mt-4 p-4 border border-dashed border-dark-4 rounded-lg">
                            <p className="text-center text-green-400 font-semibold">Verified Account</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex gap-4">
                <button className="flex-1 bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition">Add Friend</button>
                <button className="flex-1 bg-dark-4 text-light-1 font-bold py-3 rounded-lg hover:bg-dark-3 transition">Report Player</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;