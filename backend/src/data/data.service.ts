import { Injectable } from '@nestjs/common';
import type {
  Achievement,
  Document,
  LoginResponse,
  Shift,
  Team,
  User,
  ShiftStatus,
} from '../domain/entities';
import {
  achievements,
  documents,
  shifts,
  teams,
  users,
} from '../domain/seed';

@Injectable()
export class DataService {
  private teamsList = [...teams];
  private usersList = [...users];
  private shiftsList = [...shifts];
  private documentsList = [...documents];
  private achievementsList = [...achievements];

  findUserByEmail(email: string): User | undefined {
    return this.usersList.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  }

  /** Список логинов/паролей для проверки (только для отладки). */
  getCredentialsList(): { email: string; password: string; role: string; name: string }[] {
    return this.usersList.map((u) => ({
      email: u.email,
      password: u.password,
      role: u.role,
      name: u.name,
    }));
  }

  findUserById(id: string): User | undefined {
    return this.usersList.find((u) => u.id === id);
  }

  findTeamById(id: string): Team | undefined {
    return this.teamsList.find((t) => t.id === id);
  }

  getTeamMembers(teamId: string): User[] {
    return this.usersList.filter((u) => u.teamId === teamId);
  }

  getShiftsForTeam(teamId: string): Shift[] {
    return this.shiftsList.filter((s) => s.teamId === teamId);
  }

  updateShift(id: string, data: Partial<Pick<Shift, 'status' | 'userId' | 'start' | 'end' | 'role' | 'comment'>>): Shift | undefined {
    const idx = this.shiftsList.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.shiftsList[idx] = { ...this.shiftsList[idx], ...data } as Shift;
    return this.shiftsList[idx];
  }

  getDocumentsForTeam(teamId: string): Document[] {
    return this.documentsList.filter((d) => d.teamId === teamId);
  }

  getAchievementsForTeam(teamId: string): Achievement[] {
    const memberIds = this.getTeamMembers(teamId).map((m) => m.id);
    return this.achievementsList.filter((a) => memberIds.includes(a.userId));
  }

  addShift(shift: Omit<Shift, 'id'>): Shift {
    const created: Shift = {
      ...shift,
      id: `shift-${Date.now()}`,
      status: shift.status || 'draft',
    } as Shift;
    this.shiftsList.push(created);
    return created;
  }

  addUser(user: Omit<User, 'id'>): User {
    const created: User = {
      ...user,
      id: `user-${Date.now()}`,
    };
    this.usersList.push(created);
    return created;
  }

  addDocument(doc: Omit<Document, 'id' | 'createdAt'>): Document {
    const created: Document = {
      ...doc,
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.documentsList.push(created);
    return created;
  }

  buildLoginResponse(user: User): LoginResponse {
    const team = this.findTeamById(user.teamId);
    if (!team) {
      throw new Error('Team not found for user');
    }

    const stripPassword = ({ password: _, ...rest }: User) => rest;

    return {
      token: user.id,
      user: stripPassword(user) as User,
      team,
      teamMembers: this.getTeamMembers(team.id).map(stripPassword) as User[],
      shifts: this.getShiftsForTeam(team.id),
      documents: this.getDocumentsForTeam(team.id),
      achievements: this.getAchievementsForTeam(team.id),
    };
  }
}
