import type { Achievement, Document, LoginResponse, Shift, Team, User } from '../domain/entities';
export declare class DataService {
    private teamsList;
    private usersList;
    private shiftsList;
    private documentsList;
    private achievementsList;
    findUserByEmail(email: string): User | undefined;
    getCredentialsList(): {
        email: string;
        password: string;
        role: string;
        name: string;
    }[];
    findUserById(id: string): User | undefined;
    findTeamById(id: string): Team | undefined;
    getTeamMembers(teamId: string): User[];
    getShiftsForTeam(teamId: string): Shift[];
    updateShift(id: string, data: Partial<Pick<Shift, 'status' | 'userId' | 'start' | 'end' | 'role' | 'comment'>>): Shift | undefined;
    getDocumentsForTeam(teamId: string): Document[];
    getAchievementsForTeam(teamId: string): Achievement[];
    addShift(shift: Omit<Shift, 'id'>): Shift;
    addUser(user: Omit<User, 'id'>): User;
    addDocument(doc: Omit<Document, 'id' | 'createdAt'>): Document;
    buildLoginResponse(user: User): LoginResponse;
}
