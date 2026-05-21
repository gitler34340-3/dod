export type Role = 'manager' | 'worker';

export interface Team {
  id: string;
  name: string;
  city: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  teamId: string;
  position: string;
}

export type ShiftStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'conflict'
  | 'rejected';

export interface Shift {
  id: string;
  teamId: string;
  userId: string;
  start: string;
  end: string;
  role: string;
  comment?: string;
  status: ShiftStatus;
}

export interface Document {
  id: string;
  teamId: string;
  title: string;
  url?: string;
  content?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon?: string;
  earnedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  team: Team;
  teamMembers: User[];
  shifts: Shift[];
  documents: Document[];
  achievements: Achievement[];
}
