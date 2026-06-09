import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { Role } from '@prisma/client';
export declare class AttendanceController {
    private readonly attendance;
    constructor(attendance: AttendanceService);
    create(dto: CreateAttendanceDto, role: Role): Promise<{
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
    findAll(employeeId?: string, from?: string, to?: string): Promise<({
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
            canPublishStories: boolean;
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
    update(id: string, dto: UpdateAttendanceDto, role: Role): Promise<{
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
            canPublishStories: boolean;
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
    remove(id: string, role: Role): Promise<{
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
}
