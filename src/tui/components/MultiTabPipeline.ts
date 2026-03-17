export class MultiTabPipeline {
    tabs: string[];
    activeTab: string;
    private statuses: Map<string, string> = new Map();

    constructor(tabs: string[]) {
        if (tabs.length === 0) {
            throw new Error('At least one tab must be provided');
        }
        this.tabs = tabs;
        this.activeTab = tabs[0];
        
        for (const tab of tabs) {
            this.statuses.set(tab, 'pending');
        }
    }

    switchTab(tab: string): void {
        if (this.tabs.includes(tab)) {
            this.activeTab = tab;
        }
    }

    updateStatus(tab: string, status: string): void {
        if (this.tabs.includes(tab)) {
            this.statuses.set(tab, status);
        }
    }

    getStatus(tab: string): string | undefined {
        return this.statuses.get(tab);
    }
}
