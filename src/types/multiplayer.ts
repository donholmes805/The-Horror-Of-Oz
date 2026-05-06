import { Timestamp } from 'firebase/firestore';

export type RoomStatus = 'waiting' | 'active' | 'completed' | 'canceled';
export type GameMode = 'solo' | 'bot' | 'pvp' | 'coop' | 'multiplayer_adventure';

export interface GameRoom {
  id: string;
  mode: GameMode;
  status: RoomStatus;
  hostUserId: string;
  playerIds: string[];
  maxPlayers: number;
  minPlayers: number;
  paidOnly: boolean;
  inviteCode?: string;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  currentTurnUserId?: string;
  turnOrder: string[];
  currentRound: number;
  campaignId?: string;
  currentNode?: string;
  roomState: Record<string, any>;
  settings: {
    turnLimitSeconds: number;
    allowSpectators: boolean;
    isPublic: boolean;
  };
}

export interface RoomPlayer {
  userId: string;
  username: string;
  avatar: string;
  membershipStatus: 'free' | 'paid';
  joinedAt: Timestamp;
  ready: boolean;
  roleInRoom: 'host' | 'player' | 'spectator';
  stats: {
    health: number;
    maxHealth: number;
    courage: number;
    hope: number;
    steel: number;
    memory: number;
  };
  inventory: {
    hand: string[];
    deck: string[];
    discard: string[];
  };
  roomState?: Record<string, any>;
  status: 'active' | 'defeated' | 'escaped' | 'disconnected';
}

export interface RoomEvent {
  id: string;
  roomId: string;
  type: string;
  actorUserId: string;
  targetUserId?: string;
  message: string;
  payload: Record<string, any>;
  createdAt: Timestamp;
}

export interface BotDefinition {
  id: string;
  name: string;
  type: 'scout' | 'patrol' | 'sentinel' | 'hound' | 'boss';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  health: number;
  attack: number;
  defense: number;
  abilities: string[];
  description: string;
}

export interface MatchResult {
  id: string;
  roomId: string;
  mode: GameMode;
  winners: string[];
  losers: string[];
  rewards: Array<{
    userId: string;
    type: 'shards' | 'card' | 'badge';
    value: any;
  }>;
  createdAt: Timestamp;
}
