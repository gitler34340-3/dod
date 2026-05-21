import { PrismaService } from '../prisma/prisma.service';
import { CreateEmploymentContractDto, UpdateEmploymentContractDto } from './dto/index';
export declare class EmploymentContractService {
    private prisma;
    constructor(prisma: PrismaService);
    getContractByEmployeeId(employeeId: string, currentUserId?: string, userRole?: string): Promise<any>;
    getAllContracts(): Promise<any>;
    createContractForEmployee(employeeId: string, dto?: CreateEmploymentContractDto): Promise<any>;
    updateContract(contractId: string, dto: UpdateEmploymentContractDto, userRole: string): Promise<any>;
    deleteContract(contractId: string, userRole: string): Promise<any>;
    private generateDefaultContent;
}
