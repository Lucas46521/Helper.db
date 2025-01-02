"use strict";
const { EventEmitter } = require("events");

class MongoDriver extends EventEmitter {
    url;
    options;
    conn;
    mongoose;
    models = new Map();
    docSchema;

    constructor(url, options = {}, pluralize = false) {
        super();
        this.url = url;
        this.options = options;
        this.mongoose = require("mongoose");

        if (!pluralize) this.mongoose.pluralize(null);

        this.docSchema = new this.mongoose.Schema({
            ID: {
                type: this.mongoose.SchemaTypes.String,
                required: true,
                unique: true,
            },
            data: {
                type: this.mongoose.SchemaTypes.Mixed,
                required: false,
            },
            expireAt: {
                type: this.mongoose.SchemaTypes.Date,
                required: false,
                default: null,
            },
        }, {
            timestamps: true,
        });

        this.attachMongooseListeners();
    }

    attachMongooseListeners() {
        this.mongoose.connection.on("connected", () => {
            this.emit("connected", "Mongoose connected to the database.");
        });

        this.mongoose.connection.on("disconnected", () => {
            this.emit("disconnected", "Mongoose disconnected from the database.");
        });

        this.mongoose.connection.on("reconnected", () => {
            this.emit("reconnected", "Mongoose reconnected to the database.");
        });

        this.mongoose.connection.on("error", (err) => {
            this.emit("error", "Mongoose encountered an error:", err);
        });
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.mongoose.connect(this.url, this.options)
                .then(connection => {
                    this.conn = connection;
                    resolve(this);
                })
                .catch(err => {
                    this.emit("error", "Failed to connect to the database.", err);
                    reject(err);
                });
        });
    }

    async close(force) {
        const result = await this.conn?.close(force);
        this.emit("disconnected", "Mongoose manually disconnected from the database.");
        return result;
    }

    checkConnection() {
        if (this.conn == null)
            throw new Error(`MongoDriver is not connected to the database`);
    }

    async prepare(table) {
        this.checkConnection();
        if (!this.models.has(table))
            this.models.set(table, this.modelSchema(table));
    }

    async getModel(name) {
        await this.prepare(name);
        return this.models.get(name);
    }

    async getAllRows(table) {
        this.checkConnection();
        const model = await this.getModel(table);
        const rows = await model.find();
        this.emit("rowsFetched", `Rows fetched from table '${table}'`, rows);
        return rows.map((row) => ({
            id: row.ID,
            value: row.data,
        }));
    }

    async getRowByKey(table, key) {
        this.checkConnection();
        const model = await this.getModel(table);
        const res = await model.findOne({ ID: key });
        if (!res) {
            this.emit("rowNotFound", `Row with key '${key}' not found in table '${table}'`);
            return [null, false];
        }
        this.emit("rowFetched", `Fetched row with key '${key}' from table '${table}'`, res.data);
        return [res.data, true];
    }

    async setRowByKey(table, key, value) {
        this.checkConnection();
        const model = await this.getModel(table);
        await model?.findOneAndUpdate(
            { ID: key },
            { $set: { data: value } },
            { upsert: true }
        );
        this.emit("rowUpdated", `Updated row with key '${key}' in table '${table}'`, value);
        return value;
    }

    async deleteAllRows(table) {
        this.checkConnection();
        const model = await this.getModel(table);
        const res = await model?.deleteMany();
        this.emit("rowsDeleted", `Deleted all rows from table '${table}'`, res.deletedCount);
        return res.deletedCount;
    }

    async deleteRowByKey(table, key) {
        this.checkConnection();
        const model = await this.getModel(table);
        const res = await model?.deleteMany({ ID: key });
        this.emit("rowDeleted", `Deleted row with key '${key}' from table '${table}'`, res.deletedCount);
        return res.deletedCount;
    }

    modelSchema(modelName = "JSON") {
        this.checkConnection();

        if (this.conn.models[modelName]) {
            return this.conn.models[modelName];
        }

        const model = this.conn.model(modelName, this.docSchema);

        model.collection
            .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
            .catch(() => {});

        return model;
    }
}

exports.MongoDriver = MongoDriver;
//# sourceMappingURL=MongoDriver.js.map