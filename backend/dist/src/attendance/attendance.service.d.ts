import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
export declare class AttendanceService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateAttendanceDto, requesterRole: Role): Promise<{
        employee: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workHours: number | null;
    }>;
    findAll(filters: {
        employeeId?: string;
        from?: string;
        to?: string;
    }): Promise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workHours: number | null;
    })[]>;
    findOne(id: string): Promise<{
        employee: {
            id: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            hireDate: Date;
            hourlyRate: number;
            departmentId: string | null;
        };
    } & {
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workHours: number | null;
    }>;
    update(id: string, dto: UpdateAttendanceDto, requesterRole: Role): Promise<{
        employee: {
            id: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            hireDate: Date;
            hourlyRate: number;
            departmentId: string | null;
        };
    } & {
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workHours: number | null;
    }>;
    remove(id: string, requesterRole: Role): Promise<{
        id: string;
        employeeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        notes: string | null;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workHours: number | null;
    }>;
    private requireCanManageAttendance;
    private calcWorkHours;
}
