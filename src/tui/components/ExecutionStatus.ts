export class ExecutionStatus {
    currentStatus: string = 'idle';
    lastSteeringMessage: string | null = null;

    updateStatus(status: string): void {
        this.currentStatus = status;
    }

    injectSteering(message: string): void {
        this.lastSteeringMessage = message;
    }
}
