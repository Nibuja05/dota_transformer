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
var valve_kv_1 = require("valve-kv");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
function load() {
    var filePath = path.join(__dirname, "npc_units.txt");
    var obj = valve_kv_1.deserializeFile(filePath);
    return obj["DOTAUnits"];
}
function write(classes) {
    var content = "declare const enum UnitBaseClasses {\n";
    classes.forEach(function (name) {
        var shortName = name.replace("npc_dota_", "");
        shortName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
        content += "\t" + shortName + " = \"" + name + "\",\n";
    });
    content += "}";
    var filePath = path.join(__dirname, "output.txt");
    fs.writeFileSync(filePath, content, "utf-8");
}
var obj = load();
var baseClasses = new Set();
for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
    var _b = _a[_i], name_1 = _b[0], unitKV = _b[1];
    if (valve_kv_1.isKvObject(unitKV)) {
        if ("BaseClass" in unitKV) {
            baseClasses.add(unitKV["BaseClass"]);
        }
    }
}
write(baseClasses);
