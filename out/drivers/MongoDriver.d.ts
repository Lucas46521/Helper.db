import type mongoose from "mongoose";
import { IDriver } from "./IDriver";
export interface CollectionInterface<T = unknown> {
    ID: string;
    data: T;
    createdAt: Date;
    updatedAt: Date;
    expireAt?: Date;
}
export declare class MongoDriver implements IDriver {
    url: string;
    options: mongoose.ConnectOptions;
    conn?: mongoose.Connection;
    mongoose: typeof mongoose;
    private models;
    docSchema: mongoose.Schema<CollectionInterface<unknown>>;
    constructor(url: string, options?: mongoose.ConnectOptions, pluralize?: boolean);
    connect(): Promise<MongoDriver>;
    close(force?: boolean): Promise<void>;
    private checkConnection;
    prepare(table: string): Promise<void>;
    private getModel;
    getAllRows(table: string): Promise<{
        id: string;
        value: any;
    }[]>;
    getRowByKey<T>(table: string, key: string): Promise<[T | null, boolean]>;
    setRowByKey<T>(table: string, key: string, value: any): Promise<T>;
    deleteAllRows(table: string): Promise<number>;
    deleteRowByKey(table: string, key: string): Promise<number>;
    modelSchema<T = unknown>(modelName?: string): mongoose.Model<CollectionInterface<T>>;
}
