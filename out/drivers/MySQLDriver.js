"use strict";
const { EventEmitter } = require("events");

class MySQLDriver extends EventEmitter {
    static instance;
    _mysql;
    conn;
    config;

    get mysql() {
        return this._mysql;
    }

    constructor(config) {
        super();
        this.config = config;
        this._mysql = require("mysql2/promise");
    }

    static createSingleton(config) {
        if (!this.instance) this.instance = new MySQLDriver(config);
        return this.instance;
    }

    checkConnection() {
        if (!this.conn) {
            this.emit("error", {
                message: "MySQL not connected to the database",
                error: new Error("MySQL not connected to the database"),
            });
            throw new Error("MySQL not connected to the database");
        }
    }

    async connect() {
        try {
            if (typeof this.config == "string") {
                this.conn = await this._mysql.createPool(this.config);
            } else {
                this.conn = await this._mysql.createPool(this.config);
            }
            this.emit("connected", { message: "Successfully connected to the database" });
        } catch (error) {
            this.emit("error", { message: "Failed to connect to the database", error });
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.conn.end();
            this.emit("disconnected", { message: "Disconnected from the database" });
        } catch (error) {
            this.emit("error", { message: "Failed to disconnect from the database", error });
            throw error;
        }
    }

    async prepare(table) {
        this.checkConnection();
        await this.conn.query(
            `CREATE TABLE IF NOT EXISTS ${table} (ID VARCHAR(255) PRIMARY KEY, json TEXT)`
        );
        this.emit("tablePrepared", { message: `Table '${table}' is prepared`, table });
    }

    async getAllRows(table) {
        this.checkConnection();
        const [rows] = await this.conn.query(`SELECT * FROM ${table}`);
        return rows.map((row) => ({
            id: row.ID,
            value: JSON.parse(row.json),
        }));
    }

    async getRowByKey(table, key) {
        this.checkConnection();
        const [rows] = await this.conn.query(`SELECT json FROM ${table} WHERE ID = ?`, [key]);
        if (rows.length === 0) {
            return [null, false];
        }
        return [JSON.parse(rows[0].json), true];
    }

    async setRowByKey(table, key, value, update) {
        this.checkConnection();
        const stringifiedJson = JSON.stringify(value);
        if (update) {
            await this.conn.query(`UPDATE ${table} SET json = (?) WHERE ID = (?)`, [stringifiedJson, key]);
        } else {
            await this.conn.query(`INSERT INTO ${table} (ID,json) VALUES (?,?)`, [key, stringifiedJson]);
        }
        this.emit("rowSet", `Row with key '${key}' has been set in table '${table}'`, table, key, value);
        return value;
    }

    async deleteAllRows(table) {
        this.checkConnection();
        const [rows] = await this.conn.query(`DELETE FROM ${table}`);
        this.emit("rowsDeleted", `All rows from table '${table}' have been deleted`, table, rows.affectedRows);
        return rows.affectedRows;
    }

    async deleteRowByKey(table, key) {
        this.checkConnection();
        const [rows] = await this.conn.query(`DELETE FROM ${table} WHERE ID=?`, [key]);
        this.emit("rowDeleted", `Row with key '${key}' has been deleted from table '${table}'`, table, key);
        return rows.affectedRows;
    }
}

exports.MySQLDriver = MySQLDriver;
//# sourceMappingURL=MySQLDriver.js.map