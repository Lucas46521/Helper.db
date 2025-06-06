"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelperDB = exports.JSONDriver = exports.MemoryDriver = exports.MySQLDriver = exports.SqliteDriver = exports.MongoDriver = void 0;
const lodash_1 = require("lodash");
const SqliteDriver_1 = require("./drivers/SqliteDriver");
var MongoDriver_1 = require("./drivers/MongoDriver");
Object.defineProperty(exports, "MongoDriver", { enumerable: true, get: function () { return MongoDriver_1.MongoDriver; } });
var SqliteDriver_2 = require("./drivers/SqliteDriver");
Object.defineProperty(exports, "SqliteDriver", { enumerable: true, get: function () { return SqliteDriver_2.SqliteDriver; } });
var MySQLDriver_1 = require("./drivers/MySQLDriver");
Object.defineProperty(exports, "MySQLDriver", { enumerable: true, get: function () { return MySQLDriver_1.MySQLDriver; } });
var MemoryDriver_1 = require("./drivers/MemoryDriver");
Object.defineProperty(exports, "MemoryDriver", { enumerable: true, get: function () { return MemoryDriver_1.MemoryDriver; } });
var JSONDriver_1 = require("./drivers/JSONDriver");
Object.defineProperty(exports, "JSONDriver", { enumerable: true, get: function () { return JSONDriver_1.JSONDriver; } });
class HelperDB {
    static instance;
    prepared;
    _driver;
    tableName;
    normalKeys;
    options;
    get driver() {
        return this._driver;
    }
    constructor(options = {}) {
        options.table ??= "json";
        options.filePath ??= "json.sqlite";
        options.driver ??= new SqliteDriver_1.SqliteDriver(options.filePath);
        options.normalKeys ??= false;
        this.options = options;
        this._driver = options.driver;
        this.tableName = options.table;
        this.normalKeys = options.normalKeys;
        this.prepared = this.driver.prepare(this.tableName);
    }
    async addSubtract(key, value, sub = false) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    if (value == null)
      throw new Error("Missing second argument (value)");
    let currentNumber = await this.get(key);
    if (currentNumber == null)
      currentNumber = 0;
    if (typeof currentNumber != "number") {
      try {
        currentNumber = parseFloat(currentNumber);
      }
      catch (_) {
        throw new Error(`Current value with key: (${key}) is not a number and couldn't be parsed to a number`);
      }
    }
    if (typeof value != "number") {
      try {
        value = parseFloat(value);
      }
      catch (_) {
        throw new Error(`Value to add/subtract with key: (${key}) is not a number and couldn't be parsed to a number`);
      }
    }
    sub ? (currentNumber -= value): (currentNumber += value);
    await this.set(key, currentNumber);
    return currentNumber;
  }
  async getArray(key) {
    const currentArr = (await this.get(key)) ?? [];
    if (!Array.isArray(currentArr))
      throw new Error(`Current value with key: (${key}) is not an array`);
    return currentArr;
  }
  static createSingleton(options = {}) {
    if (!this.instance && !options.driver)
      throw Error("No instance and driver provided");
    if (!this.instance)
      this.instance = new HelperDB(options);
    return this.instance;
  }
  async init() {
    await this.prepared;
  }
  async all() {
    return this.driver.getAllRows(this.tableName);
  }
  async get(key) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    if (key.includes(".") && !this.normalKeys) {
      const keySplit = key.split(".");
      const [result] = await this.driver.getRowByKey(this.tableName, keySplit[0]);
      return (0, lodash_1.get)(result, keySplit.slice(1).join("."));
    }
    const [result] = await this.driver.getRowByKey(this.tableName, key);
    return result;
  }
  async set(key, value) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    if (value == null)
      throw new Error("Missing second argument (value)");
    if (key.includes(".") && !this.normalKeys) {
      const keySplit = key.split(".");
      const [result,
        exist] = await this.driver.getRowByKey(this.tableName, keySplit[0]);
      let obj;
      if (result instanceof Object == false) {
        obj = {};
      } else {
        obj = result;
      }
      const valueSet = (0, lodash_1.set)(obj ?? {}, keySplit.slice(1).join("."), value);
      return this.driver.setRowByKey(this.tableName, keySplit[0], valueSet, exist);
    }
    const exist = (await this.driver.getRowByKey(this.tableName, key))[1];
    return this.driver.setRowByKey(this.tableName, key, value, exist);
  }
  async has(key) {
    return (await this.get(key)) != null;
  }
  async delete(key) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    if (key.includes(".")) {
      const keySplit = key.split(".");
      const obj = (await this.get(keySplit[0])) ?? {};
      (0, lodash_1.unset)(obj, keySplit.slice(1).join("."));
      return this.set(keySplit[0], obj);
    }
    return this.driver.deleteRowByKey(this.tableName, key);
  }
  async deleteAll() {
    return this.driver.deleteAllRows(this.tableName);
  }
  async add(key, value) {
    return this.addSubtract(key, value);
  }
  async sub(key, value) {
    return this.addSubtract(key, value, true);
  }
  async push(key, ...values) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    if (values.length === 0)
      throw new Error("Missing second argument (value)");
    const currentArr = await this.getArray(key);
    currentArr.push(...values);
    return this.set(key, currentArr);
  }
  async unshift(key, value) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    if (value == null)
      throw new Error("Missing second argument (value)");
    let currentArr = await this.getArray(key);
    if (Array.isArray(value))
      currentArr = value.concat(currentArr);
    else
      currentArr.unshift(value);
    return this.set(key, currentArr);
  }
  async pop(key) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    const currentArr = await this.getArray(key);
    const value = currentArr.pop();
    this.set(key, currentArr);
    return value;
  }
  async shift(key) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    const currentArr = await this.getArray(key);
    const value = currentArr.shift();
    this.set(key, currentArr);
    return value;
  }
  async pull(key, value, once = false) {
    if (typeof key != "string")
      throw new Error("First argument (key) needs to be a string");
    if (value == null)
      throw new Error("Missing second argument (value)");
    const currentArr = await this.getArray(key);
    if (!Array.isArray(value) && typeof value != "function")
      value = [value];
    const data = [];
    for (const i in currentArr) {
      if (Array.isArray(value)
        ? value.includes(currentArr[i]): value(currentArr[i], i))
        continue;
      data.push(currentArr[i]);
      if (once)
        break;
    }
    return this.set(key, data);
  }
  table(table) {
    if (typeof table != "string")
      throw new Error("First argument (table) needs to be a string");
    const options = {
      ...this.options
    };
    options.table = table;
    options.driver = this.driver;
    return new HelperDB(options);
  }
  async tableAsync(table) {
    const db = this.table(table);
    await db.prepared;
    return db;
  }
  useNormalKeys(activate) {
    this.normalKeys = activate;
  }
  async search(term, property = null) {
    if (term == null && property == null)
      throw new Error("At least one argument (term or property) is required");

    const allData = await this.all();

    const results = allData.filter((entry) => {
      if (!entry.value) return false;

      if (property) {
        if (!(property in entry.value)) return false;

        if (term != null) {
          const propValue = entry.value[property];
          return (
            propValue === term ||
            (typeof propValue === "string" && propValue.includes(term)) ||
            (Array.isArray(propValue) && propValue.some((item) => item === term || item?.toString()?.includes(term))) ||
            (typeof propValue === "object" && Object.values(propValue).some((val) => val === term || val?.toString()?.includes(term)))
          );
        }

        return true;
      }

      if (typeof entry.value === "string") {
        return entry.value.includes(term);
      } else if (Array.isArray(entry.value)) {
        return entry.value.some((item) => item === term || item?.toString()?.includes(term));
      } else if (typeof entry.value === "object") {
        return Object.values(entry.value).some((val) => val === term || val?.toString()?.includes(term));
      }

      return entry.value === term;
    });

    return results;
  }
  async in(term,
    property = null,
    key = "") {
    if (term == null && property == null)
      throw new Error("At least one argument (term or property) is required");
    if (typeof key !== "string")
      throw new Error("Third argument (key) needs to be a string");

    const data = key === "" ? await this.all(): (await this.get(key)) ?? [];

    return data.filter((entry) => {
      if (!entry.value) return false;

      if (property) {
        if (!(property in entry.value)) return false;

        const propValue = entry.value[property];

        if (term != null) {
          return (
            propValue === term ||
            (typeof propValue === "string" && propValue.includes(term)) ||
            (Array.isArray(propValue) && propValue.includes(term)) ||
            (typeof propValue === "object" && Object.values(propValue).some((val) => val === term || (typeof val === "string" && val.includes(term))))
          );
        }

        return true;
      }

      if (term != null) {
        if (typeof entry.value === "string") {
          return entry.value.includes(term);
        } else if (Array.isArray(entry.value)) {
          return entry.value.some((item) => item === term || (typeof item === "string" && item.includes(term)));
        } else if (typeof entry.value === "object") {
          return Object.values(entry.value).some((val) => val === term || (typeof val === "string" && val.includes(term)));
        }
      }

      return false;
    });
  }
  async between(min,
    max,
    property = null,
    key = "") {
    if (typeof min !== "number" || typeof max !== "number")
      throw new Error("First and second arguments (min and max) need to be numbers");
    if (property != null && typeof property !== "string")
      throw new Error("Third argument (property) needs to be a string or null");
    if (typeof key !== "string")
      throw new Error("Fourth argument (key) needs to be a string");

    const data = key === "" ? await this.all(): (await this.get(key)) ?? [];

    return data.filter((entry) => {
      if (!entry.value) return false;

      if (property) {
        if (!(property in entry.value)) return false;

        const propValue = entry.value[property];
        if (typeof propValue === "number") {
          return propValue >= min && propValue <= max;
        }
        return false;
      }

      if (typeof entry.value === "number") {
        return entry.value >= min && entry.value <= max;
      }

      return false;
    });
  }
  async endsWith(query,
    key = "") {
    if (typeof query !== "string")
      throw new Error("First argument (query) needs to be a string");
    if (typeof key !== "string")
      throw new Error("Second argument (key) needs to be a string");

    const data = key === "" ? await this.all(): (await this.get(key)) ?? [];

    return data.filter((entry) => {
      if (!entry.id) return false;
      return entry.id.endsWith(query);
    });
  }
  async startsWith(query,
    key = "") {
    if (typeof query !== "string")
      throw new Error("First argument (query) needs to be a string");
    if (typeof key !== "string")
      throw new Error("Second argument (key) needs to be a string");

    const data = key === "" ? await this.all(): (await this.get(key)) ?? [];

    return data.filter((entry) => {
      if (!entry.id) return false;
      return entry.id.startsWith(query);
    });
  }
  async regex(pattern,
    property = null,
    key = "") {
    if (!(pattern instanceof RegExp))
      throw new Error("First argument (pattern) needs to be a RegExp");
    if (property && typeof property !== "string")
      throw new Error("Second argument (property) needs to be a string or null");
    if (typeof key !== "string")
      throw new Error("Third argument (key) needs to be a string");

    const data = key === "" ? await this.all(): (await this.get(key)) ?? [];

    return data.filter((entry) => {
      if (!entry.value) return false;

      if (property) {
        if (!(property in entry.value)) return false;
        const propValue = entry.value[property];
        return typeof propValue === "string" && pattern.test(propValue);
      }

      if (typeof entry.value === "string") {
        return pattern.test(entry.value);
      }
      return false;
    });
  }
  async compare(property,
    operator,
    value,
    key = "") {
    if (typeof property !== "string")
      throw new Error("First argument (property) needs to be a string");
    if (typeof operator !== "string")
      throw new Error("Second argument (operator) needs to be a string");
    if (key && typeof key !== "string")
      throw new Error("Fourth argument (key) needs to be a string");

    const validOperators = ["==",
      "===",
      "!=",
      "!==",
      ">",
      "<",
      ">=",
      "<="];
    if (!validOperators.includes(operator))
      throw new Error(`Invalid operator: ${operator}`);

    const data = key === "" ? await this.all(): (await this.get(key)) ?? [];

    return data.filter((entry) => {
      if (!entry.value || !(property in entry.value)) return false;

      const propValue = entry.value[property];

      switch (operator) {
        case "==":
          return propValue == value;
        case "===":
          return propValue === value;
        case "!=":
          return propValue != value;
        case "!==":
          return propValue !== value;
        case ">":
          return propValue > value;
        case "<":
          return propValue < value;
        case ">=":
          return propValue >= value;
        case "<=":
          return propValue <= value;
        default:
          return false;
      }
    });
  }
  async custom(filterFunction,
    key = "") {
    if (typeof filterFunction !== "function")
      throw new Error("First argument (filterFunction) needs to be a function");
    if (typeof key !== "string")
      throw new Error("Second argument (key) needs to be a string");

    const data = key === "" ? await this.all(): (await this.get(key)) ?? [];

    const results = [];
    for (const entry of data) {
      const result = await filterFunction(entry);
      if (result) {
        results.push(entry);
      }
    }
    return results;
  }
}
exports.HelperDB = HelperDB;
//# sourceMappingURL=index.js.map