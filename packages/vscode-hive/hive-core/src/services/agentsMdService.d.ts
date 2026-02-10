import type { ContextService } from './contextService.js';
export interface InitResult {
    content: string;
    existed: boolean;
}
export interface SyncResult {
    proposals: string[];
    diff: string;
}
export interface ApplyResult {
    path: string;
    chars: number;
    isNew: boolean;
}
export declare class AgentsMdService {
    private readonly rootDir;
    private readonly contextService;
    constructor(rootDir: string, contextService: ContextService);
    init(): Promise<InitResult>;
    sync(featureName: string): Promise<SyncResult>;
    apply(content: string): ApplyResult;
    private extractFindings;
    private generateProposals;
    private formatDiff;
    private scanAndGenerate;
    private detectProjectInfo;
    private detectPackageManager;
    private detectLanguage;
    private detectTestFramework;
    private detectMonorepo;
    private generateTemplate;
}
