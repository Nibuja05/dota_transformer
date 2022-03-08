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
exports.validateCustomGameevents = exports.validateNettables = void 0;
const ts = __importStar(require("typescript"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const valve_kv_1 = require("valve-kv");
const transform_1 = require("dota_transformer_pkg/transform");
const BASE_NETTABLE_CONTENT = `<!-- kv3 encoding:text:version{e21c7f3c-8a33-41c5-9977-a76d3a32aa0d} format:generic:version{7412167c-06e9-4698-aff2-e63eb59037e7} -->
{
	custom_net_tables =
	[
		"$"
	]
}`;
function compareArrays(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (const elem1 of arr1) {
        if (!arr2.includes(elem1))
            return false;
    }
    return true;
}
let vTimeout_Nettables;
let vTimeout_Gameevents;
function tryValidate(type, success) {
    if (type === "Nettables") {
        if (vTimeout_Nettables) {
            clearTimeout(vTimeout_Nettables);
        }
        vTimeout_Nettables = setTimeout(success, 200);
    }
    if (type === "Gameevents") {
        if (vTimeout_Gameevents) {
            clearTimeout(vTimeout_Gameevents);
        }
        vTimeout_Gameevents = setTimeout(success, 200);
    }
}
function getAllDeclarationFiles(basePath) {
    let declarationFiles = [];
    const dirContent = fs.readdirSync(basePath);
    for (const contentPath of dirContent) {
        const newPath = path.join(basePath, contentPath);
        if (fs.lstatSync(newPath).isDirectory()) {
            declarationFiles = declarationFiles.concat(getAllDeclarationFiles(newPath));
        }
        else {
            if (contentPath.includes(".d.ts")) {
                declarationFiles.push(newPath);
            }
        }
    }
    return declarationFiles;
}
function getNettableFields(node) {
    const nettables = [];
    const checkNodes = (node) => {
        if (ts.isInterfaceDeclaration(node)) {
            if (node.name.text === "CustomNetTableDeclarations") {
                for (const member of node.members) {
                    if (member.name) {
                        nettables.push(member.name.escapedText.toString());
                    }
                }
            }
        }
        ts.forEachChild(node, checkNodes);
    };
    checkNodes(node);
    return nettables;
}
function getAllNettables(files) {
    let allNettables = [];
    for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.ES2016);
        const nettables = getNettableFields(sourceFile);
        allNettables = allNettables.concat(nettables);
    }
    return allNettables;
}
function checkCurrentNettableFile(scriptPath, entries) {
    const nettableFilePath = path.join(scriptPath, "custom_net_tables.txt");
    if (entries.length < 1)
        return;
    if (fs.existsSync(nettableFilePath)) {
        const curContent = fs.readFileSync(nettableFilePath, "utf-8");
        const regex = /\"(\w+)\"/g;
        let match;
        const curEntries = [];
        while ((match = regex.exec(curContent)) !== null) {
            curEntries.push(match[1]);
        }
        if (!compareArrays(entries, curEntries)) {
            const content = BASE_NETTABLE_CONTENT.replace("$", entries.join(`",\n\t\t"`));
            fs.writeFileSync(nettableFilePath, content, "utf-8");
        }
    }
    else {
        const content = BASE_NETTABLE_CONTENT.replace("$", entries.join(`",\n\t\t"`));
        fs.writeFileSync(nettableFilePath, content, "utf-8");
    }
}
function validateNettables(rootDir, outDir) {
    tryValidate("Nettables", () => {
        console.log("Validate nettables!");
        const files = getAllDeclarationFiles(path.resolve(rootDir, "../"));
        const nettables = getAllNettables(files);
        checkCurrentNettableFile(path.resolve(outDir, "../"), nettables);
    });
}
exports.validateNettables = validateNettables;
function getMemberTypes(member, typeChecker) {
    //@ts-ignore
    const type = typeChecker.getTypeAtLocation(member.type);
    if (!type.symbol)
        return {};
    if (!type.symbol.declarations)
        return {};
    const declaration = type.symbol.declarations[0];
    if (ts.isInterfaceDeclaration(declaration)) {
        let memberTypes = {};
        declaration.members.forEach((value, key) => {
            if (!value.name)
                return;
            const name = value.name.escapedText.toString();
            const newType = getElementType(value, typeChecker);
            if (newType) {
                memberTypes[name] = newType;
            }
        });
        return memberTypes;
    }
    return {};
}
function getElementType(element, typeChecker) {
    //@ts-ignore
    const type = typeChecker.getTypeAtLocation(element.type);
    return getTypeString(type, typeChecker);
}
function getTypeString(type, typeChecker) {
    const stringType = typeChecker.typeToString(type);
    if (["string", "number", "boolean", "Short", "Long", "Float"].includes(stringType))
        return stringType;
    if (!type.symbol) {
        if (type.isUnionOrIntersection()) {
            let stringTypes = "";
            type.types.forEach((value, _) => {
                const newType = getTypeString(value, typeChecker);
                if (!newType)
                    return;
                if (stringTypes === "")
                    stringTypes = newType;
            });
            return stringTypes;
        }
        if (type.isLiteral()) {
            if (type.isStringLiteral())
                return "string";
            if (type.isNumberLiteral())
                return "number";
            return;
        }
        return;
    }
    if (type.symbol.declarations) {
        const declaration = type.symbol.declarations[0];
        if (ts.isEnumMember(declaration)) {
            if (!declaration.initializer)
                return;
            if (ts.isNumericLiteral(declaration.initializer))
                return "Short";
            if (ts.isStringLiteral(declaration.initializer))
                return "string";
        }
    }
    return;
}
function getGameeventFields(node, program) {
    const gameevents = {};
    const typeChecker = program.getTypeChecker();
    const checkNodes = (node) => {
        if (ts.isInterfaceDeclaration(node)) {
            if (node.name.text === "GameEventDeclarations") {
                for (const member of node.members) {
                    if (member.name) {
                        const eventName = member.name.escapedText.toString();
                        const types = getMemberTypes(member, typeChecker);
                        let transformedTypes = {};
                        for (const [tName, tVal] of Object.entries(types)) {
                            let newVal;
                            switch (tVal) {
                                case "number":
                                case "Float":
                                    newVal = "float";
                                    break;
                                case "Short":
                                    newVal = "short";
                                    break;
                                case "Long":
                                    newVal = "long";
                                    break;
                                case "boolean":
                                    newVal = "bool";
                                    break;
                                default:
                                    newVal = "string";
                            }
                            transformedTypes[tName] = newVal;
                        }
                        gameevents[eventName] = transformedTypes;
                    }
                }
            }
        }
        ts.forEachChild(node, checkNodes);
    };
    checkNodes(node);
    return gameevents;
}
function getAllGameevents(files, program) {
    let allGameevents = {};
    for (const file of files) {
        // const content = fs.readFileSync(file, "utf-8");
        // console.log("TRY", file);
        // console.log(program.getSourceFile(file)?.isDeclarationFile);
        const sourceFile = program.getSourceFile(file);
        if (!sourceFile)
            continue;
        const gameevents = getGameeventFields(sourceFile, program);
        allGameevents = Object.assign(Object.assign({}, allGameevents), gameevents);
    }
    return allGameevents;
}
function checkCurrentGameeventsFile(scriptPath, events) {
    const gameeventsFilePath = path.join(scriptPath, "custom.gameevents");
    const eventsObjects = {
        CustomEvents: events,
    };
    const content = (0, valve_kv_1.serialize)(eventsObjects);
    fs.writeFileSync(gameeventsFilePath, content, "utf8");
}
function findScriptPath() {
    if (!fs.existsSync("game"))
        throw new transform_1.TransformerError(`"game" path not found`);
    const scriptPath = path.join("game", "scripts");
    if (!fs.existsSync(scriptPath))
        throw new transform_1.TransformerError(`"${scriptPath}" path not found`);
    return scriptPath;
}
function validateCustomGameevents(rootDir, outDir, program) {
    tryValidate("Gameevents", () => {
        console.log("Validate gameevents!");
        const files = getAllDeclarationFiles(path.resolve(rootDir, "../"));
        const events = getAllGameevents(files, program);
        checkCurrentGameeventsFile(findScriptPath(), events);
    });
}
exports.validateCustomGameevents = validateCustomGameevents;
// validateNettables("src/vscripts", "game/scripts/vscripts");
// validateCustomGameevents("src/vscripts", "game/scripts/vscripts");
