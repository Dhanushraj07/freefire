import React, { useState, useRef, useEffect } from 'react';
import { Page, User, Notification } from '../types';
import { BellIcon } from './icons/BellIcon';
import { PlusIcon } from './icons/PlusIcon';
import { UserAddIcon } from './icons/UserAddIcon';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNavigate, onLogout, notifications, onNotificationClick, onMarkAllAsRead }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <header className="bg-dark-2 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <h1 onClick={() => onNavigate(Page.HOME)} className="text-2xl font-bold text-brand-primary cursor-pointer tracking-wider">
              SquadMatch
            </h1>
            <nav className="hidden md:flex items-center space-x-6">
              <button onClick={() => onNavigate(Page.HOME)} className="text-light-2 hover:text-brand-primary transition duration-300">
                Home
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigate(Page.CREATE_ROOM)} className="flex items-center gap-2 bg-brand-primary hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition duration-300">
                <PlusIcon />
                <span className="hidden sm:inline">Create Room</span>
            </button>
            
            <div className="relative" ref={notificationDropdownRef}>
              <button onClick={() => setNotificationDropdownOpen(prev => !prev)} className="relative text-light-2 hover:text-brand-primary p-2 rounded-full transition duration-300">
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-brand-secondary rounded-full border-2 border-dark-2 text-xs font-bold text-dark-1 flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {notificationDropdownOpen && (
                 <div className="absolute right-0 mt-2 w-80 bg-dark-3 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                   <div className="p-3 flex justify-between items-center border-b border-dark-4">
                      <h4 className="font-semibold text-white">Notifications</h4>
                      {unreadCount > 0 && <button onClick={() => { onMarkAllAsRead(); }} className="text-sm text-brand-secondary hover:underline">Mark all as read</button>}
                   </div>
                   <div className="py-1 max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} onClick={() => { onNotificationClick(n); setNotificationDropdownOpen(false); }} className={`flex items-start gap-3 px-4 py-3 hover:bg-dark-4 cursor-pointer ${!n.isRead ? 'bg-brand-primary/10' : ''}`}>
                          <div className="w-8 h-8 flex-shrink-0 bg-dark-4 rounded-full flex items-center justify-center mt-1">
                            <UserAddIcon className="w-5 h-5 text-brand-secondary" />
                          </div>
                          <div>
                            <p className="text-sm text-light-1">{n.message}</p>
                            <p className="text-xs text-light-2">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 bg-brand-secondary rounded-full self-center flex-shrink-0 ml-auto"></div>}
                        </div>
                      )) : (
                        <p className="text-center text-light-2 py-8 px-4">You have no notifications.</p>
                      )}
                   </div>
                 </div>
              )}
            </div>

            <div className="relative" ref={profileDropdownRef}>
              <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="flex items-center space-x-3 cursor-pointer">
                <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full border-2 border-dark-4" />
                <span className="hidden lg:inline font-semibold text-light-1">{user.name}</span>
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-3 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                  <a
                    onClick={() => { onNavigate(Page.PROFILE); setProfileDropdownOpen(false); }}
                    className="block px-4 py-2 text-sm text-light-1 hover:bg-dark-4 cursor-pointer"
                  >
                    My Profile
                  </a>
                  <a
                    onClick={() => { onLogout(); setProfileDropdownOpen(false); }}
                    className="block px-4 py-2 text-sm text-light-1 hover:bg-dark-4 cursor-pointer"
                  >
                    Sign Out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
