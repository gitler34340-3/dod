"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
const common_1 = require("@nestjs/common");
const seed_1 = require("../domain/seed");
let DataService = class DataService {
    teamsList = [...seed_1.teams];
    usersList = [...seed_1.users];
    shiftsList = [...seed_1.shifts];
    documentsList = [...seed_1.documents];
    achievementsList = [...seed_1.achievements];
    findUserByEmail(email) {
        return this.usersList.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }
    getCredentialsList() {
        return this.usersList.map((u) => ({
            email: u.email,
            password: u.password,
            role: u.role,
            name: u.name,
        }));
    }
    findUserById(id) {
        return this.usersList.find((u) => u.id === id);
    }
    findTeamById(id) {
        return this.teamsList.find((t) => t.id === id);
    }
    getTeamMembers(teamId) {
        return this.usersList.filter((u) => u.teamId === teamId);
    }
    getShiftsForTeam(teamId) {
        return this.shiftsList.filter((s) => s.teamId === teamId);
    }
    updateShift(id, data) {
        const idx = this.shiftsList.findIndex((s) => s.id === id);
        if (idx === -1)
            return undefined;
        this.shiftsList[idx] = { ...this.shiftsList[idx], ...data };
        return this.shiftsList[idx];
    }
    getDocumentsForTeam(teamId) {
        return this.documentsList.filter((d) => d.teamId === teamId);
    }
    getAchievementsForTeam(teamId) {
        const memberIds = this.getTeamMembers(teamId).map((m) => m.id);
        return this.achievementsList.filter((a) => memberIds.includes(a.userId));
    }
    addShift(shift) {
        const created = {
            ...shift,
            id: `shift-${Date.now()}`,
            status: shift.status || 'draft',
        };
        this.shiftsList.push(created);
        return created;
    }
    addUser(user) {
        const created = {
            ...user,
            id: `user-${Date.now()}`,
        };
        this.usersList.push(created);
        return created;
    }
    addDocument(doc) {
        const created = {
            ...doc,
            id: `doc-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        this.documentsList.push(created);
        return created;
    }
    buildLoginResponse(user) {
        const team = this.findTeamById(user.teamId);
        if (!team) {
            throw new Error('Team not found for user');
        }
        const stripPassword = ({ password: _, ...rest }) => rest;
        return {
            token: user.id,
            user: stripPassword(user),
            team,
            teamMembers: this.getTeamMembers(team.id).map(stripPassword),
            shifts: this.getShiftsForTeam(team.id),
            documents: this.getDocumentsForTeam(team.id),
            achievements: this.getAchievementsForTeam(team.id),
        };
    }
};
exports.DataService = DataService;
exports.DataService = DataService = __decorate([
    (0, common_1.Injectable)()
], DataService);
//# sourceMappingURL=data.service.js.map