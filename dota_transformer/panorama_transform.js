"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const ts = __importStar(require("typescript"));
const checkDeclarations_1 = require("dota_transformer/checkDeclarations");
const transform_1 = require("dota_transformer/transform");
let initialized = false;
/**
 * Check what abilities are currently defined already.
 */
function inititialize() {
    if (initialized === true)
        return;
    initialized = true;
    transform_1.getConfiguration();
}
/**
 * Creates the transformer.
 */
const createDotaTransformer = (program) => (context) => {
    const tsConfig = transform_1.setTsConfig(program);
    if (tsConfig) {
        checkDeclarations_1.validateCustomGameevents(tsConfig.rootDir, tsConfig.output, program);
    }
    inititialize();
    const visit = (node) => {
        if (transform_1.configuration.disable === true)
            return node;
        return ts.visitEachChild(node, visit, context);
    };
    return (file) => {
        const res = ts.visitNode(file, visit);
        return res;
    };
};
exports.default = createDotaTransformer;
