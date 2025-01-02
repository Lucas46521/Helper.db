"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresDriver = void 0;
const { Pool } = require("pg");
const { EventEmitter } = require("events");

class PostgresDriver extends EventEmitter {
    static instance;
    config;
    conn;

    constructor(config) {
        super();
        this.config = config;
    }

    static createSingleton(config) {
        if (!this.instance)
            this.instance = new PostgresDriver(config);
        return this.instance;
    }

    async connect() {
        try {
            this.conn = new Pool(this.config);
            this.emit("connected", "Successfully connected to the Postgres database");
        } catch (error) {
            this.emit("error", "Failed to connect to the Postgres database", error );
            throw error;
        }
    }

    async disconnect() {
        this.checkConnection();
        await this.conn.end();
        this.emit("disconnected", "Disconnected from the Postgres database");
    }

    checkConnection() {
        if (!this.conn) {
            const error = new Error("No connection to postgres database");
            this.emit("error", error.message, error );
            throw error;
        }
    }

    async prepare(table) {
        this.checkConnection();
        await this.conn.query(`CREATE TABLE IF NOT EXISTS ${table} (id VARCHAR(255), value TEXT)`);
        this.emit("tablePrepared", `Table '${table}' prepared successfully`, table);
    }

    async getAllRows(table) {
        this.checkConnection();
        const queryResult = await this.conn.query(`SELECT * FROM ${table}`);
        const rows = queryResult.rows.map((row) => ({
            id: row.id,
            value: JSON.parse(row.value),
        }));
        return rows;
    }

    async getRowByKey(table, key) {
        this.checkConnection();
        const queryResult = await this.conn.query(`SELECT value FROM ${table} WHERE id = $1`, [key]);
        if (queryResult.rowCount < 1) {
            this.emit("rowNotFound", `No row found with key '${key}' in table '${table}'`, table, key);
            return [null, false];
        }
        const result = JSON.parse(queryResult.rows[0].value);
        return [result, true];
    }

    async setRowByKey(table, key, value, update) {
        this.checkConnection();
        const stringifiedValue = JSON.stringify(value);
        if (update) {
            await this.conn.query(`UPDATE ${table} SET value = $1 WHERE id = $2`, [stringifiedValue, key]);
            this.emit("rowUpdated", `Updated row with key '${key}' in table '${table}'`, table, key, value);
        } else {
            await this.conn.query(`INSERT INTO ${table} (id, value) VALUES ($1, $2)`, [key, stringifiedValue]);
            this.emit("rowInserted", `Inserted new row with key '${key}' into table '${table}'`, table, key, value);
        }
        return value;
    }

    async deleteAllRows(table) {
        this.checkConnection();
        const queryResult = await this.conn.query(`DELETE FROM ${table}`);
        this.emit("rowsDeleted", `Deleted all rows from table '${table}'`, table, queryResult.rowCount );
        return queryResult.rowCount;
    }

    async deleteRowByKey(table, key) {
        this.checkConnection();
        const queryResult = await this.conn.query(`DELETE FROM ${table} WHERE id = $1`, [key]);
        this.emit("rowDeleted", { `Deleted row with key '${key}' from table '${table}'`, table, key);
        return queryResult.rowCount;
    }
}

exports.PostgresDriver = PostgresDriver;
//# sourceMappingURL=PostgresDriver.js.map