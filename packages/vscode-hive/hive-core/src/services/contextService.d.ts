import type { ContextFile } from '../types.js';
export type { ContextFile };
export declare class ContextService {
    private projectRoot;
    constructor(projectRoot: string);
    write(featureName: string, fileName: string, content: string): string;
    read(featureName: string, fileName: string): string | null;
    list(featureName: string): ContextFile[];
    delete(featureName: string, fileName: string): boolean;
    compile(featureName: string): string;
    archive(featureName: string): {
        archived: string[];
        archivePath: string;
    };
    stats(featureName: string): {
        count: number;
        totalChars: number;
        oldest?: string;
        newest?: string;
    };
    private normalizeFileName;
}
