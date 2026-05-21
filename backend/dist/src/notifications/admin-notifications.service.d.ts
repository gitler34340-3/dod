interface OrderCreatedEvent {
    id: string;
    source: string;
    createdAt: string;
}
export declare class AdminNotificationsService {
    emitOrderCreated(data: OrderCreatedEvent): void;
    emitShiftStatusChanged(data: {
        shiftId: string;
        status: string;
        changedAt: string;
    }): void;
    emitShiftExchange(data: {
        shiftId: string;
        fromEmployeeId: string;
        toEmployeeId: string;
        createdAt: string;
    }): void;
}
export {};
