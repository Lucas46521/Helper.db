"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDriver = void 0;
class MongoDriver {
    url;
    options;
    conn;
    mongoose;
    models = new Map();
    docSchema;
    constructor(url, options = {}, pluralize = false) {
        this.url = url;
        this.options = options;
        this.mongoose = require("mongoose");
        if (!pluralize)
            this.mongoose.pluralize(null);
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
    }
    connect() {
    return new Promise((resolve, reject) => {
        // Criando uma conexão com mongoose de maneira assíncrona
        this.mongoose.connect(this.url, this.options)
            .then(connection => {
                this.conn = connection;
                resolve(this); // Conexão estabelecida com sucesso
            })
            .catch(err => {
                reject(err); // Caso haja erro na conexão
            });
    });
}
    async close(force) {
        return await this.conn?.close(force);
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
        return (await model.find()).map((row) => ({
            id: row.ID,
            value: row.data,
        }));
    }
    async getRowByKey(table, key) {
        this.checkConnection();
        const model = await this.getModel(table);
        const res = await model.findOne({ ID: key });
        if (!res)
            return [null, false];
        return [res.data, true];
    }
    async setRowByKey(table, key, value) {
        this.checkConnection();
        const model = await this.getModel(table);
        await model?.findOneAndUpdate({
            ID: key,
        }, {
            $set: { data: value },
        }, { upsert: true });
        return value;
    }
    async deleteAllRows(table) {
        this.checkConnection();
        const model = await this.getModel(table);
        const res = await model?.deleteMany();
        return res.deletedCount;
    }
    async deleteRowByKey(table, key) {
        this.checkConnection();
        const model = await this.getModel(table);
        const res = await model?.deleteMany({
            ID: key,
        });
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