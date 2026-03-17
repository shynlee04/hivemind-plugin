export class ExecutionStatus {
    public currentStatus: string = 'idle';
    public lastSteeringMessage: string | null = null;

    public updateStatus(status: string): void {
        this.currentStatus = status;
    }

    public injectSteering(message: string): void {
        this.lastSteeringMessage = message;
    }
}
