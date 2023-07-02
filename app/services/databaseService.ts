import IDatabaseService from "../interfaces/iDatabaseService";
import ILogger from "../interfaces/iLogger";

const Keyv = require('keyv');
// const KeyvSqlite = require('@keyv/sqlite');

class DatabaseService implements IDatabaseService {
    private keyv: typeof Keyv;
    private dbPath: string;
    private debug: boolean = false;
    private log: boolean = false;
    private logger: ILogger;

    constructor(dbPath: string, debug: boolean, log: boolean, logger: ILogger) {
        this.dbPath = dbPath;
        this.debug = debug;
        this.log = log;
        this.logger = logger;

        this.keyv = new Keyv(dbPath);
        this.keyv.on('error', (err: any) => {
            if (debug) {
                console.error('Database connection error:', err);
            }

            if (log) {
                this.logger.log(err);
            }
        });
    }

    async set(key: string, value: any) {
        await this.keyv.set(key, value);
    }

    async get(key: string) {
        return this.keyv.get(key);
    }

    async delete(key: string) {
        return this.keyv.delete(key);
    }

    async clear() {
        return this.keyv.clear();
    }
}

export default DatabaseService;
