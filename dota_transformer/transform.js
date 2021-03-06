"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTsConfig = exports.getTsConfig = exports.getConfiguration = exports.TransformerError = exports.debugPrint = exports.isNumberArr = exports.isNumber = exports.isInt = exports.configuration = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// initially set to the default config
exports.configuration = {
    modularization: "folder" /* Folder */,
    debug: false,
    strict: "warn" /* Warn */,
    disable: false,
};
/**
 * Is the given number in the string an integer or a float?
 * Negative values as handled as float, since dota tooltips work this way...
 * @param num number string to check
 * @returns true, if its an integer
 */
function isInt(num) {
    const parsedNum = parseFloat(num);
    if (parsedNum < 0)
        return false;
    return Number.isInteger(parsedNum);
}
exports.isInt = isInt;
/**
 * Check if the given input is a valid number.
 * @param val number or string represented number
 * @returns true, if its a valid number
 */
function isNumber(val) {
    if (typeof val === "number")
        return true;
    const num = parseFloat(val);
    if (!num)
        return false;
    if (isNaN(num))
        return false;
    return isFinite(num);
}
exports.isNumber = isNumber;
/**
 * Check if the given input is an array of valid numbers.
 * Its assumed that all elements are the same type.
 * @param arr input array
 * @returns true, if its a number array
 */
function isNumberArr(arr) {
    if (arr.length < 1)
        return false;
    return isNumber(arr[0]);
}
exports.isNumberArr = isNumberArr;
/**
 * Print debug messages
 * @param msg message to print
 */
function debugPrint(msg) {
    if (exports.configuration.debug)
        console.log("> " + msg);
}
exports.debugPrint = debugPrint;
/**
 * Custom error for this transfomer.
 */
class TransformerError {
    constructor(message) {
        const text = `\x1b[91m${message}\x1b[0m`;
        const error = Error(text);
        Object.defineProperties(error, {
            message: {
                get() {
                    return text;
                },
            },
            name: {
                get() {
                    return "TransformerError";
                },
            },
        });
        Error.captureStackTrace(error, TransformerError);
        return error;
    }
}
exports.TransformerError = TransformerError;
/**
 * Read the current configuration file or create a new one if none exists.
 */
function getConfiguration() {
    const filePath = ".abilityTransformerrc.json";
    if (!fs.existsSync(filePath)) {
        return;
    }
    else {
        const content = fs.readFileSync(filePath, "utf-8");
        const newConfig = JSON.parse(content);
        for (const [key, val] of Object.entries(newConfig)) {
            exports.configuration[key] = val;
        }
    }
    debugPrint("Get current configuration");
}
exports.getConfiguration = getConfiguration;
let curTSConfig;
/**
 * Get the current tsconfig paths
 * @returns
 */
function getTsConfig() {
    if (!curTSConfig)
        throw new TransformerError("TS configuration not found!");
    return curTSConfig;
}
exports.getTsConfig = getTsConfig;
/**
 * Read the current tsconfig file and load its paths
 * @param program
 * @returns
 */
function setTsConfig(program) {
    if (curTSConfig)
        return curTSConfig;
    const configFilePath = program.getCompilerOptions().configFilePath;
    const match = configFilePath.match(/(.*)[\/\\]tsconfig\.json/);
    if (!match)
        throw new TransformerError("No valid path for tsconfig file: ");
    const configFileDir = match[1];
    const configFileRaw = fs.readFileSync(configFilePath, "utf-8");
    const configFile = JSON.parse(configFileRaw);
    const rootDir = configFile.compilerOptions.rootDir
        ? path.resolve(configFileDir, configFile.compilerOptions.rootDir)
        : configFileDir;
    const outDir = configFile.compilerOptions.outDir
        ? path.resolve(configFileDir, configFile.compilerOptions.outDir)
        : configFileDir;
    curTSConfig = {
        rootDir: rootDir.replace(/\\/g, "/"),
        output: outDir.replace(/\\/g, "/"),
    };
    return curTSConfig;
}
exports.setTsConfig = setTsConfig;
