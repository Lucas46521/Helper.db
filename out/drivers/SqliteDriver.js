"use strict";
const { EventEmitter } = require("events");

class SqliteDriver extends EventEmitter {
    static instance = null;
    _database;

    get database() {
        return this._database;
    }

    constructor(path) {
        super();
        const sqlite3 = require("better-sqlite3");
        this._database = sqlite3(path);
    }

    static createSingleton(path) {
        if (!SqliteDriver.instance) {
            SqliteDriver.instance = new SqliteDriver(path);
        }
        return SqliteDriver.instance;
    }

    async prepare(table) {
        await this._database.exec(`CREATE TABLE IF NOT EXISTS ${table} (ID TEXT PRIMARY KEY, json TEXT)`);
        this.emit("tablePrepared", `Table '${table}' prepared successfully`, { table });
    }

    async getAllRows(table) {
        const prep = this._database.prepare(`SELECT * FROM ${table}`);
        const data = [];
        for (const row of prep.iterate()) {
            data.push({
                id: row.ID,
                value: JSON.parse(row.json),
            });
        }
        this.emit("rowsFetched", `Fetched all rows from table '${table}'`, { table, rows: data });
        return data;
    }

    async getRowByKey(table, key) {
        const value = await this._database
            .prepare(`SELECT json FROM ${table} WHERE ID = @key`)
            .get({ key });
        if (value) {
            const result = JSON.parse(value.json);
            this.emit("rowFetched", `Fetched row with key '${key}' from table '${table}'`, { table, key, result });
            return [result, true];
        } else {
            this.emit("rowNotFound", `No row found with key '${key}' in table '${table}'`, { table, key });
            return [null, false];
        }
    }

    async setRowByKey(table, key, value, update) {
        const stringifiedJson = JSON.stringify(value);
        if (update) {
            await this._database
                .prepare(`UPDATE ${table} SET json = (?) WHERE ID = (?)`)
                .run(stringifiedJson, key);
            this.emit("rowUpdated", `Updated row with key '${key}' in table '${table}'`, { table, key, value });
        } else {
            await this._database
                .prepare(`INSERT INTO ${table} (ID,json) VALUES (?,?)`)
                .run(key, stringifiedJson);
            this.emit("rowInserted", `Inserted new row with key '${key}' into table '${table}'`, { table, key, value });
        }
        return value;
    }

    async deleteAllRows(table) {
        const result = await this._database
            .prepare(`DELETE FROM ${table}`)
            .run();
        this.emit("rowsDeleted", `Deleted all rows from table '${table}'`, { table, count: result.changes });
        return result.changes;
    }

    async deleteRowByKey(table, key) {
        const result = await this._database
            .prepare(`DELETE FROM ${table} WHERE ID=@key`)
            .run({ key });
        this.emit("rowDeleted", `Deleted row with key '${key}' from table '${table}'`, { table, key });
        return result.changes;
    }
}

exports.SqliteDriver = SqliteDriver;
//# sourceMappingURL=SqliteDriver.js.map