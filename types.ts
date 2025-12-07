
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export enum MatchType {
  SOLO = 'Solo',
  DUO = 'Duo',
  SQUAD = 'Squad',
}

export enum SkillLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  PRO = 'Pro',
}

export enum Region {
  NA = 'North America',
  EU = 'Europe',
  ASIA = 'Asia',
  SA = 'South America',
  OCEANIA = 'Oceania',
}

export enum RequestStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string;
  inGameId: string;
  reputation: number;
  isVerified: boolean;
  matchesPlayed?: number;
  wins?: number;
}

export interface BasicUserInfo {
  id: string;
  name: string;
  avatarUrl: string;
  inGameId: string;
  reputation: number;
  isVerified: boolean;
}

export interface RoomOwner {
  id: string;
  name: string;
  avatarUrl: string;
  isVerified: boolean;
}

export interface JoinRequest {
  id: string; // Firestore document ID
  roomId: string;
  user: BasicUserInfo;
  status: RequestStatus;
  // FIX: Use Date type for consistency in the app state.
  createdAt: Date;
  roomOwnerId?: string;
}

export interface RoomMatch {
  id: string;
  gameName: string;
  roomId: string;
  matchType: MatchType;
  region: Region;
  skillLevel: SkillLevel;
  // FIX: Use Date type for consistency in the app state.
  startTime: Date;
  password?: string;
  owner: RoomOwner;
  acceptedPlayers: BasicUserInfo[];
  maxPlayers: number;
  // FIX: Use Date type for consistency in the app state.
  createdAt: Date;
}

export enum Page {
  HOME = 'Home',
  CREATE_ROOM = 'Create Room',
  ROOM_DETAILS = 'Room Details',
  PROFILE = 'Profile',
  VOICE_CHAT = 'Voice Chat',
}

export interface Notification {
  id: string;
  userId: string; // The user who should receive the notification
  message: string;
  roomId: string; // To link to the room
  isRead: boolean;
  // FIX: Use Date type for consistency in the app state.
  createdAt: Date;
}
