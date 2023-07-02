interface IDatabaseService {
    set(key: string, value: any): Promise<void>;
    get(key: string): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

export default IDatabaseService;