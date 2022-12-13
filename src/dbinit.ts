import { Pool } from 'pg';

const dbsettings = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: +(process.env.PGPORT || 5432)
};
export const sql = new Pool(dbsettings);