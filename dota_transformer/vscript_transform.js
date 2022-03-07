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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_modules = require("node_modules-path");
const valve_kv_1 = require("valve-kv");
const transformEnums_1 = require("dota_transformer_pkg/transformEnums");
const checkDeclarations_1 = require("dota_transformer_pkg/checkDeclarations");
const transform_1 = require("dota_transformer_pkg/transform");
const GENERATED_FILE_NAME = {
    ["Ability" /* Ability */]: "/generatedAbilities.kv",
    ["Unit" /* Unit */]: "/generatedUnits.kv",
};
const GENERATED_FILE_PATH = {
    ["Ability" /* Ability */]: "generatedAbilities",
    ["Unit" /* Unit */]: "generatedUnits",
};
const BASE_NAME = {
    ["Ability" /* Ability */]: "DOTAAbilities",
    ["Unit" /* Unit */]: "DOTAUnits",
};
const PATH_ADDITION = {
    ["Ability" /* Ability */]: "/abilities",
    ["Unit" /* Unit */]: "/units",
};
const PATH_BASE_FILE = {
    ["Ability" /* Ability */]: "/../npc_abilities_custom.txt",
    ["Unit" /* Unit */]: "/../npc_units_custom.txt",
};
const BASE_OBJECT = (type) => `"${BASE_NAME[type]}"\n{\n}`;
const GENERATED_TYPES_PATH = {
    ["Ability" /* Ability */]: path.join(__dirname, "_generated", "abilities.d.ts"),
    ["Unit" /* Unit */]: path.join(__dirname, "_generated", "units.d.ts"),
};
const BASE_TYPE = {
    ["Ability" /* Ability */]: `
declare const enum CustomAbilities {
	$
}`,
    ["Unit" /* Unit */]: `
interface CustomUnits {
	$
}`,
};
const abilityMap = new Map();
const curAbilities = new Map();
const curAbilityNames = new Set();
const unitMap = new Map();
const curUnits = new Map();
const curUnitNames = new Set();
let curError = false;
/**
 * Get the path to the directory inside "scripts/npc"
 * @returns dir path
 */
function getBasePath(type) {
    const vPath = transform_1.getTsConfig().output;
    const baseDir = path.resolve(vPath, "../npc");
    if (!fs.existsSync(baseDir))
        throw new transform_1.TransformerError("NPC script path not found");
    const genPath = baseDir + PATH_ADDITION[type];
    if (!fs.existsSync(genPath))
        fs.mkdirSync(genPath);
    return genPath;
}
/**
 * Get the file path of an object based on the current node.
 * @param node current node
 * @returns current node file path (relative from "vscripts")
 */
function getCleanedFilePath(node) {
    const rootPath = transform_1.getTsConfig().rootDir;
    const absPath = ts.getOriginalNode(node).getSourceFile().fileName;
    const cleanedPath = absPath.substring(absPath.indexOf(rootPath) + rootPath.length + 1);
    return cleanedPath.replace(".ts", "");
}
/**
 * Get all currently generated objects.
 * @returns generated objects
 */
function getAllGeneratedObjects(type) {
    const thisPath = getBasePath(type);
    const filePath = thisPath + GENERATED_FILE_NAME[type];
    if (!fs.existsSync(filePath)) {
        transform_1.debugPrint("Failed to find " + GENERATED_FILE_NAME[type]);
        return;
    }
    return valve_kv_1.deserializeFile(filePath);
}
/**
 * Get all currently generated objects.
 * @returns generated objects
 */
function getGeneratedObjects(type, absPath) {
    const filePath = getPathName(type, absPath);
    if (!fs.existsSync(filePath)) {
        transform_1.debugPrint("Failed to find " + filePath);
        return;
    }
    return valve_kv_1.deserializeFile(filePath);
}
/**
 * Writes the information of this object to a file, based on current configuration.
 * @param absPath orig file path (to determine modularization)
 * @param obj object to write
 */
function writeGeneratedObjects(type, absPath, obj) {
    const content = valve_kv_1.serialize({ [BASE_NAME[type]]: obj });
    const filePath = getPathName(type, absPath);
    transform_1.debugPrint("Write to " + filePath);
    fs.writeFileSync(filePath, content);
    addBase(type, absPath);
}
/**
 * Writes the information of this ability object to a file.
 * Never uses modularization.
 * @param obj
 */
function writeAllGeneratedObjects(type, obj) {
    const content = valve_kv_1.serialize({ [BASE_NAME[type]]: obj });
    const filePath = getBasePath(type) + GENERATED_FILE_NAME[type];
    transform_1.debugPrint(`Write all objects [${type}]`);
    fs.writeFileSync(filePath, content);
}
/**
 * Get the name of the module for this path. Only relevant if the modularization is not none.
 * @param filePath path to get the module name
 * @returns module name
 */
function getModuleName(filePath) {
    switch (transform_1.configuration.modularization) {
        case "none" /* None */:
            return "";
        case "file" /* File */: {
            const match = filePath.match(/(^.*[\/\\])?(\w+)(\.lua)?/);
            return match ? match[2] : "root";
        }
        case "folder" /* Folder */: {
            const match = filePath.match(/(^.*[\/\\])?(\w+)[\/\\]\w+(\.lua)?/);
            return match ? match[2] : "root";
        }
    }
}
/**
 * Get the final ability path to write an ability to.
 * @param absPath source path
 * @returns final ability path
 */
function getPathName(type, absPath) {
    const thisPath = getBasePath(type);
    let filePath;
    switch (transform_1.configuration.modularization) {
        case "none" /* None */:
            filePath = thisPath + GENERATED_FILE_NAME[type];
            break;
        case "file" /* File */:
        case "folder" /* Folder */:
            const moduleName = getModuleName(absPath);
            filePath = path.resolve(thisPath, GENERATED_FILE_PATH[type], moduleName + ".kv");
    }
    return filePath;
}
/**
 * Add a new base to the generatedAbilities.kv file.
 * Checks if the base already exists.
 * @param absPath abs path of the ability
 */
function addBase(type, absPath) {
    transform_1.debugPrint("Check bases [Add]");
    if (transform_1.configuration.modularization === "none" /* None */)
        return;
    const moduleName = getModuleName(absPath);
    const curBases = getBases(type);
    if (curBases.includes(moduleName)) {
        transform_1.debugPrint("Base " + moduleName + " already included");
        return;
    }
    writeBases(type, [...curBases, moduleName]);
}
/**
 * Remove a base from the generatedAbilities.kv file.
 * Checks if the base actually exists.
 * @param absPath abs path of the ability
 */
function removeBase(type, absPath) {
    transform_1.debugPrint("Check bases [Remove]");
    if (transform_1.configuration.modularization === "none" /* None */)
        return;
    const moduleName = getModuleName(absPath);
    const curBases = getBases(type);
    if (!curBases.includes(moduleName)) {
        transform_1.debugPrint("Base " + moduleName + " not included");
        return;
    }
    writeBases(type, curBases.filter((base) => base !== moduleName));
}
/**
 * Checks whether the generated object kv is already included in the base file.
 * If not, it includes it.
 */
function checkBase(type) {
    const basePath = getBasePath(type);
    const baseFilePath = basePath + PATH_BASE_FILE[type];
    transform_1.debugPrint("Check if " + GENERATED_FILE_NAME[type] + " is already included as base");
    if (!fs.existsSync(baseFilePath)) {
        fs.writeFileSync(baseFilePath, BASE_OBJECT(type));
    }
    else {
        const baseFile = fs.readFileSync(baseFilePath).toString();
        const regex = /^#base\s+["'](.*)["']/gm;
        let match;
        const includedFiles = [];
        while ((match = regex.exec(baseFile)) !== null) {
            if (!match)
                continue;
            includedFiles.push(match[1]);
        }
        const fileName = PATH_ADDITION[type].substring(1) + GENERATED_FILE_NAME[type];
        if (!includedFiles.includes(fileName)) {
            fs.writeFileSync(baseFilePath, `#base "${fileName}"\n${baseFile}`);
        }
    }
}
/**
 * Get the source file name of a generated object.
 * @param obj object
 * @returns source file name
 */
function getSourceFileName(type, obj) {
    if (type === "Ability" /* Ability */) {
        return obj["ScriptFile"];
    }
    else {
        const content = obj["vscripts"];
        if (!content)
            return;
        return content.replace(".lua", "");
    }
}
let initialized = false;
/**
 * Check what abilities are currently defined already.
 */
function inititialize() {
    var _a;
    if (initialized === true)
        return;
    initialized = true;
    transform_1.getConfiguration();
    if (transform_1.configuration.disable === true)
        return;
    console.log("[Dota Transformer] Initialize...");
    for (const type of ["Ability" /* Ability */, "Unit" /* Unit */]) {
        checkBase(type);
        let origfileContent;
        try {
            origfileContent = getAllGeneratedObjects(type);
        }
        catch (_b) {
            transform_1.debugPrint("Failed to read " + GENERATED_FILE_NAME[type]);
        }
        let fileContent = {};
        if (!origfileContent || Object.keys(origfileContent).length === 0) {
            transform_1.debugPrint(GENERATED_FILE_NAME[type] + " is empty or not found");
            const thisPath = `${getBasePath(type)}${GENERATED_FILE_NAME[type]}`;
            fs.writeFileSync(thisPath, BASE_OBJECT(type));
            if (transform_1.configuration.modularization !== "none" /* None */) {
                const basePath = `${getBasePath(type)}/${GENERATED_FILE_PATH[type]}`;
                if (!fs.existsSync(basePath))
                    fs.mkdirSync(basePath);
            }
            console.log("\x1b[32m%s\x1b[0m", "[Dota Transformer] Initialization complete!\n");
            return;
        }
        else {
            fileContent = origfileContent[BASE_NAME[type]];
        }
        for (const [key, value] of Object.entries(fileContent)) {
            const fileName = getSourceFileName(type, value);
            if (!fileName)
                continue;
            if (type === "Ability" /* Ability */) {
                let abilitySet = abilityMap.get(fileName);
                if (!abilitySet)
                    abilitySet = new Set();
                abilitySet.add(key);
                abilityMap.set(fileName, abilitySet);
            }
            else {
                let unitSet = unitMap.get(fileName);
                if (!unitSet)
                    unitSet = new Set();
                unitSet.add(key);
                unitMap.set(fileName, unitSet);
            }
        }
        const bases = getBases(type);
        // Adjust the bases to the current configuration
        switch (transform_1.configuration.modularization) {
            case "none" /* None */: {
                transform_1.debugPrint("Switch to modularization: " + transform_1.configuration.modularization);
                if (bases.length > 0) {
                    writeAllGeneratedObjects(type, fileContent);
                }
                const basePath = `${getBasePath(type)}/${GENERATED_FILE_PATH[type]}`;
                if (fs.existsSync(basePath)) {
                    fs.rmdirSync(basePath, { recursive: true });
                }
                break;
            }
            case "file" /* File */:
            case "folder" /* Folder */:
                transform_1.debugPrint("Switch to modularization: " + transform_1.configuration.modularization);
                const basePath = `${getBasePath(type)}/${GENERATED_FILE_PATH[type]}`;
                if (!fs.existsSync(basePath)) {
                    fs.mkdirSync(basePath);
                }
                else {
                    fs.rmdirSync(basePath, { recursive: true });
                    fs.mkdirSync(basePath);
                }
                const moduleMap = new Map();
                for (const [key, value] of Object.entries(fileContent)) {
                    const fileName = getSourceFileName(type, value);
                    if (!fileName)
                        continue;
                    const moduleName = getModuleName(fileName);
                    const curModules = (_a = moduleMap.get(moduleName)) !== null && _a !== void 0 ? _a : {};
                    curModules[key] = value;
                    moduleMap.set(moduleName, curModules);
                }
                transform_1.debugPrint(`Write new modularized ${type} files...`);
                const newBases = [];
                moduleMap.forEach((value, key) => {
                    newBases.push(key);
                    const content = valve_kv_1.serialize({ [BASE_NAME[type]]: value });
                    const thisPath = basePath + `/${key}.kv`;
                    fs.writeFileSync(thisPath, content);
                });
                writeBases(type, newBases);
                break;
        }
    }
    console.log("\x1b[32m%s\x1b[0m", "[Ability Transformer] Initialization complete!\n");
}
/**
 * Get all current bases for the modularization.
 * @returns
 */
function getBases(type) {
    transform_1.debugPrint("Get current bases");
    const finalFilePath = getBasePath(type) + GENERATED_FILE_PATH[type];
    if (!fs.existsSync(finalFilePath))
        return [];
    const content = fs.readFileSync(finalFilePath, "utf-8");
    const regex = /^#base\s+\".*?\/(.*).kv\"/gm;
    let match;
    const bases = [];
    while ((match = regex.exec(content)) !== null) {
        bases.push(match[1]);
    }
    return bases;
}
/**
 * Write the bases for a .kv file.
 * @param bases list of bases
 */
function writeBases(type, bases) {
    let basesString = "";
    for (const base of bases) {
        basesString += `#base "${GENERATED_FILE_PATH[type]}/${base}.kv"\n`;
    }
    basesString += BASE_OBJECT(type);
    const filePath = `${getBasePath(type)}${GENERATED_FILE_NAME[type]}`;
    transform_1.debugPrint("Refresh bases");
    fs.writeFileSync(filePath, basesString);
}
/**
 * Create the ability text from the given information and update the ability kvs.
 * @param ability ability Information
 */
function writeAbility(ability) {
    var _a;
    transform_1.debugPrint("Prepare write of ability");
    const formattedSpecials = {};
    for (let i = 0; i < ability.specials.length; i++) {
        const special = ability.specials[i];
        const index = (i + 1).toString().padStart(2, "0");
        const formattedValue = Array.isArray(special.value) ? special.value.join(" ") : special.value.toString();
        const otherFields = {};
        for (const [name, val] of Object.entries(special)) {
            if (name === "name" || name === "type" || name === "value")
                continue;
            otherFields[name] = val;
        }
        formattedSpecials[index] = Object.assign({ var_type: special.type, [special.name]: formattedValue }, otherFields);
    }
    const replacedProperties = {};
    for (const [name, val] of Object.entries(ability.properties)) {
        const replacedName = (_a = transformEnums_1.DifferentlyNamedAbilityKVs[name]) !== null && _a !== void 0 ? _a : name;
        replacedProperties[replacedName] = val;
    }
    const kvAbility = Object.assign(Object.assign({ BaseClass: "ability_lua", ScriptFile: ability.scriptFile }, replacedProperties), ability.customProperties);
    if (ability.specials.length > 0) {
        kvAbility.AbilitySpecial = Object.assign({}, formattedSpecials);
    }
    const origfileContent = getGeneratedObjects("Ability" /* Ability */, ability.scriptFile);
    let fileContent = {};
    if (origfileContent) {
        fileContent = origfileContent.DOTAAbilities;
    }
    fileContent[ability.name] = kvAbility;
    writeGeneratedObjects("Ability" /* Ability */, ability.scriptFile, fileContent);
    curAbilityNames.add(ability.name);
    updateTypes("Ability" /* Ability */);
}
/**
 * Remove an ability from the KV ability file.
 * @param absPath absolute path of the ability
 * @param abilityName name of the ability
 * @param remBase should the base be removed?
 */
function removeAbility(absPath, abilityName, remBase) {
    transform_1.debugPrint("Remove ability: " + abilityName);
    const origfileContent = getGeneratedObjects("Ability" /* Ability */, absPath);
    const abilityFilePath = getPathName("Ability" /* Ability */, absPath);
    let fileContent = {};
    if (origfileContent) {
        fileContent = origfileContent.DOTAAbilities;
    }
    delete fileContent[abilityName];
    if (remBase)
        removeBase("Ability" /* Ability */, absPath);
    if (Object.keys(fileContent).length === 0 && transform_1.configuration.modularization !== "none" /* None */) {
        fs.unlinkSync(abilityFilePath);
        return;
    }
    const abilityStr = valve_kv_1.serialize({ DOTAAbilities: fileContent });
    fs.writeFileSync(abilityFilePath, abilityStr);
    curAbilityNames.delete(abilityName);
    updateTypes("Ability" /* Ability */);
}
/**
 * Create the unit text from the given information and update the unit kvs.
 * @param unit unit Information
 */
function writeUnit(unit) {
    var _a;
    transform_1.debugPrint("Prepare write of unit");
    const abilities = {};
    for (const [index, name] of Object.entries(unit.abilities)) {
        abilities[`Ability${index}`] = name;
    }
    const baseClass = (_a = unit.properties.BaseClass) !== null && _a !== void 0 ? _a : "npc_dota_creature";
    const newProperties = unit.properties;
    delete newProperties.BaseClass;
    const kvUnit = Object.assign(Object.assign(Object.assign(Object.assign({ BaseClass: baseClass }, abilities), newProperties), unit.customProperties), { vscripts: `${unit.scriptFile}.lua` });
    const origfileContent = getGeneratedObjects("Unit" /* Unit */, unit.scriptFile);
    let fileContent = {};
    if (origfileContent) {
        fileContent = origfileContent.DOTAUnits;
    }
    fileContent[unit.name] = kvUnit;
    writeGeneratedObjects("Unit" /* Unit */, unit.scriptFile, fileContent);
    curUnitNames.add(unit.name);
    updateTypes("Unit" /* Unit */);
}
/**
 * Remove an unit from the KV ability file.
 * @param absPath absolute path of the unit
 * @param unitName name of the unit
 * @param remBase should the base be removed?
 */
function removeUnit(absPath, unitName, remBase) {
    transform_1.debugPrint("Remove unit: " + unitName);
    const origfileContent = getGeneratedObjects("Unit" /* Unit */, absPath);
    const unitFilePath = getPathName("Unit" /* Unit */, absPath);
    let fileContent = {};
    if (origfileContent) {
        fileContent = origfileContent.DOTAUnits;
    }
    delete fileContent[unitName];
    if (remBase)
        removeBase("Unit" /* Unit */, absPath);
    if (Object.keys(fileContent).length === 0 && transform_1.configuration.modularization !== "none" /* None */) {
        fs.unlinkSync(unitFilePath);
        return;
    }
    const unitStr = valve_kv_1.serialize({ DOTAUnits: fileContent });
    fs.writeFileSync(unitFilePath, unitStr);
    curAbilityNames.delete(unitName);
    updateTypes("Ability" /* Ability */);
}
/**
 * Get the name and arguments of a decorator node.
 * @param decorator decorator node to check
 * @returns name and arguments (if any)
 */
function getDecoratorInfo(decorator) {
    const exp = decorator.expression;
    if (ts.isCallExpression(exp)) {
        const args = exp.arguments;
        const name = exp.expression.getText();
        return { name, args };
    }
    return;
}
/**
 * Get the name of a node.
 * @param node node to check
 * @returns name
 */
function getNodeName(node) {
    var _a;
    const nameNode = node.name;
    if (!ts.isIdentifier(nameNode))
        return "";
    return (_a = nameNode.escapedText) !== null && _a !== void 0 ? _a : "";
}
/**
 * Get the expression name of a node.
 * @param node node to check
 * @returns expression name
 */
function getNodeExpressionName(node) {
    var _a;
    const nameNode = node.expression;
    if (!ts.isIdentifier(nameNode))
        return "";
    return (_a = nameNode.escapedText) !== null && _a !== void 0 ? _a : "";
}
/**
 * Return the content of an object node as an object.
 * @param node object node
 * @returns object
 */
function getObjectNodeEntries(node) {
    let entries = {};
    for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property))
            continue;
        const name = getNodeName(property);
        let value = "";
        if (ts.isNumericLiteral(property.initializer) || ts.isPrefixUnaryExpression(property.initializer)) {
            value = property.initializer.getText();
        }
        else if (ts.isStringLiteral(property.initializer)) {
            value = property.initializer.text;
        }
        else if (ts.isArrayLiteralExpression(property.initializer)) {
            value = [];
            for (const elem of property.initializer.elements) {
                if (ts.isNumericLiteral(elem) || ts.isPrefixUnaryExpression(elem)) {
                    value.push(elem.getText());
                }
                else if (ts.isStringLiteral(elem)) {
                    value.push(elem.text);
                }
                else if (ts.isIdentifier(elem)) {
                    value.push(elem.escapedText.toString());
                }
            }
        }
        else if (ts.isIdentifier(property.initializer)) {
            value = property.initializer.escapedText.toString();
        }
        else if (property.initializer.kind === ts.SyntaxKind.TrueKeyword) {
            value = "1";
        }
        else if (property.initializer.kind === ts.SyntaxKind.FalseKeyword) {
            value = "0";
        }
        else if (ts.isPropertyAccessExpression(property.initializer)) {
            const name = getNodeName(property.initializer);
            const expName = getNodeExpressionName(property.initializer);
            switch (expName) {
                case "LinkedSpecialBonusOperation":
                    value = transformEnums_1.LinkedSpecialBonusOperationNames[name];
                    break;
                case "SpellImmunityTypes":
                    value = transformEnums_1.SpellImmunityTypesNames[name];
                    break;
                case "SpellDispellableTypes":
                    value = transformEnums_1.SpellDispellableTypesNames[name];
                    break;
                case "AbilityCastGestureSlotValue":
                    value = transformEnums_1.AbilityCastGestureSlotValueNames[name];
                    break;
            }
        }
        else if (ts.isObjectLiteralExpression(property.initializer)) {
            const subEntries = getObjectNodeEntries(property.initializer);
            const obj = {};
            for (const [key, value] of Object.entries(subEntries)) {
                if (Array.isArray(value))
                    throw new transform_1.TransformerError("Value array in invalid place!");
                obj[key] = value;
            }
            value = obj;
        }
        entries[name] = value;
    }
    return entries;
}
/**
 * Get the special values of an ability.
 * @param node ability special values declaration node
 * @returns ability special values
 */
function getSpecialValues(node) {
    const initializer = node.initializer;
    if (!initializer)
        return [];
    if (!ts.isObjectLiteralExpression(initializer))
        return [];
    const specials = [];
    for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property))
            continue;
        const name = getNodeName(property);
        if (ts.isNumericLiteral(property.initializer) ||
            ts.isStringLiteral(property.initializer) ||
            ts.isPrefixUnaryExpression(property.initializer)) {
            const value = property.initializer.getText();
            specials.push({
                type: transform_1.isInt(value) ? "FIELD_INTEGER" /* INTEGER */ : "FIELD_FLOAT" /* FLOAT */,
                name,
                value,
            });
        }
        else if (ts.isArrayLiteralExpression(property.initializer)) {
            const values = [];
            let type = "FIELD_INTEGER" /* INTEGER */;
            for (const elem of property.initializer.elements) {
                if (ts.isNumericLiteral(elem) || ts.isStringLiteral(elem) || ts.isPrefixUnaryExpression(elem)) {
                    values.push(elem.getText());
                    if (!transform_1.isInt(elem.getText()))
                        type = "FIELD_FLOAT" /* FLOAT */;
                }
            }
            specials.push({
                type,
                name,
                value: values,
            });
        }
        else if (ts.isObjectLiteralExpression(property.initializer)) {
            const entries = getObjectNodeEntries(property.initializer);
            let value = "";
            let type = "FIELD_INTEGER" /* INTEGER */;
            if (entries["value"]) {
                if (Array.isArray(entries["value"])) {
                    value = [];
                    for (const elem of entries["value"]) {
                        value.push(elem);
                        if (!transform_1.isInt(elem))
                            type = "FIELD_FLOAT" /* FLOAT */;
                    }
                }
                else if (typeof entries["value"] === "string") {
                    value = entries["value"];
                    if (!transform_1.isInt(entries["value"]))
                        type = "FIELD_FLOAT" /* FLOAT */;
                }
            }
            const otherEntries = {};
            for (const [name, val] of Object.entries(entries)) {
                if (name === "value")
                    continue;
                otherEntries[name] = val;
            }
            specials.push(Object.assign({ type,
                name,
                value }, otherEntries));
        }
    }
    return specials;
}
/**
 * Get the base properties of an ability.
 * @param node base property declaration node
 * @returns base properties
 */
function getAbilityBaseProperties(node) {
    const initializer = node.initializer;
    if (!initializer)
        return {};
    if (!ts.isObjectLiteralExpression(initializer))
        return {};
    const properties = {};
    for (const [name, val] of Object.entries(getObjectNodeEntries(initializer))) {
        let value;
        if (Array.isArray(val)) {
            value = transform_1.isNumberArr(val) ? val.join(" ") : val.join(" | ");
        }
        else if (typeof val === "string") {
            if (val in transformEnums_1.DifferentlyNamesEnums) {
                value = transformEnums_1.DifferentlyNamesEnums[val];
            }
            else if (transformEnums_1.NumericBaseProperties.includes(name) && !transform_1.isNumber(val)) {
                value = `%${val}`;
            }
            else {
                value = val;
            }
        }
        else {
            value = "";
        }
        properties[name] = value;
    }
    return properties;
}
/**
 * Get the base properties of an ability.
 * @param node base property declaration node
 * @returns base properties
 */
function getUnitBaseProperties(node) {
    const initializer = node.initializer;
    const properties = { BaseClass: "npc_dota_creature" };
    if (!initializer)
        return properties;
    if (!ts.isObjectLiteralExpression(initializer))
        return properties;
    for (const [name, val] of Object.entries(getObjectNodeEntries(initializer))) {
        let value;
        if (Array.isArray(val)) {
            value = transform_1.isNumberArr(val) ? val.join(" ") : val.join(" | ");
        }
        else if (typeof val === "string") {
            if (transformEnums_1.NumericBaseProperties.includes(name) && !transform_1.isNumber(val)) {
                value = `%${val}`;
            }
            else {
                value = val;
            }
        }
        else {
            value = val;
        }
        properties[name] = value;
    }
    return properties;
}
/**
 * Get the custom properties of an ability (user added).
 * @param node custom property declaration node
 * @returns custom properties
 */
function getCustomProperties(node) {
    const initializer = node.initializer;
    if (!initializer)
        return {};
    if (!ts.isObjectLiteralExpression(initializer))
        return {};
    const properties = {};
    for (const [name, val] of Object.entries(getObjectNodeEntries(initializer))) {
        properties[name] = Array.isArray(val) ? val.join(" ") : typeof val === "string" ? val : "";
    }
    return properties;
}
/**
 * Should this ability be skipped?
 * Only do so if its true.
 * @param node skip declaration node
 * @returns true if ability should be skipped
 */
function getSkipValue(node) {
    const initializer = node.initializer;
    if (!initializer)
        return false;
    if (initializer.kind === ts.SyntaxKind.TrueKeyword)
        return true;
    return false;
}
function getUnitAbilities(node) {
    const initializer = node.initializer;
    if (!initializer)
        return {};
    if (!ts.isArrayLiteralExpression(initializer))
        return {};
    const abilities = {};
    const abilityList = [];
    for (const entry of initializer.elements) {
        if (ts.isStringLiteral(entry)) {
            abilityList.push(entry.text);
        }
        if (ts.isObjectLiteralExpression(entry)) {
            const indexedEntry = getObjectNodeEntries(entry);
            const index = indexedEntry["index"];
            abilities[index] = indexedEntry["name"];
        }
    }
    let index = 1;
    for (const ability of abilityList) {
        while (index.toString() in abilities) {
            index++;
        }
        abilities[index.toString()] = ability;
    }
    return abilities;
}
/**
 * Check if a node is an ability class and write it.
 * @param node node to check
 */
function checkNode(node, program) {
    if (ts.isClassDeclaration(node)) {
        const decorators = node.decorators;
        if (!decorators)
            return;
        if (!node.name)
            return;
        let decoratorType;
        for (const deco of decorators) {
            const decoInfo = getDecoratorInfo(deco);
            if (!decoInfo)
                return;
            switch (decoInfo.name) {
                case "registerAbility" /* Ability */:
                    decoratorType = "registerAbility" /* Ability */;
                    break;
                case "registerModifier" /* Modifier */:
                    decoratorType = "registerModifier" /* Modifier */;
                    break;
                case "registerHero" /* Hero */:
                    decoratorType = "registerHero" /* Hero */;
                    break;
                case "registerUnit" /* Unit */:
                    decoratorType = "registerUnit" /* Unit */;
                    break;
                default:
                    return;
            }
        }
        const name = node.name.escapedText.toString();
        if (!decoratorType)
            return;
        if (decoratorType === "registerAbility" /* Ability */) {
            let values = [];
            let props = {};
            let customProps = {};
            let skip = false;
            const typeChecker = program.getTypeChecker();
            const nodes = getClassHeritages(node, typeChecker);
            for (const classNode of nodes) {
                classNode.forEachChild((child) => {
                    if (ts.isPropertyDeclaration(child)) {
                        const name = getNodeName(child);
                        if (name === transformEnums_1.ProtectedAbilityProperties.SpecialValues) {
                            values = values.concat(getSpecialValues(child));
                        }
                        if (name === transformEnums_1.ProtectedAbilityProperties.BaseProperties) {
                            props = Object.assign(Object.assign({}, props), getAbilityBaseProperties(child));
                        }
                        if (name === transformEnums_1.ProtectedAbilityProperties.SkipAbility) {
                            if (getSkipValue(child)) {
                                skip = true;
                            }
                        }
                        if (name === transformEnums_1.ProtectedAbilityProperties.CustomProperties) {
                            customProps = Object.assign(Object.assign({}, customProps), getCustomProperties(child));
                        }
                    }
                });
            }
            const filePath = getCleanedFilePath(node);
            if (!skip) {
                const abilityList = curAbilities.get(filePath);
                if (!abilityList)
                    return;
                if (!props) {
                    if (transform_1.configuration.strict === "warn" /* Warn */) {
                        console.log("\x1b[93m%s\x1b[0m", `[Ability Transformer] No properties for '${name}'. Skipping.`);
                    }
                    if (transform_1.configuration.strict === "error" /* Error */) {
                        throw new transform_1.TransformerError(`No properties for '${name}'. Aborting.`);
                    }
                    return;
                }
                abilityList.add({
                    name,
                    scriptFile: filePath,
                    properties: props,
                    specials: values,
                    customProperties: customProps,
                });
            }
            else {
                transform_1.debugPrint("Skipped ability creation for: " + name);
            }
        }
        else if (decoratorType === "registerUnit" /* Unit */) {
            let abilities = {};
            let props = {};
            let customProps = {};
            let skip = false;
            const typeChecker = program.getTypeChecker();
            const nodes = getClassHeritages(node, typeChecker);
            for (const classNode of nodes) {
                classNode.forEachChild((child) => {
                    if (ts.isPropertyDeclaration(child)) {
                        const name = getNodeName(child);
                        if (name === transformEnums_1.ProtectedUnitProperties.Abilities) {
                            abilities = Object.assign(Object.assign({}, abilities), getUnitAbilities(child));
                        }
                        if (name === transformEnums_1.ProtectedUnitProperties.BaseProperties) {
                            props = Object.assign(Object.assign({}, props), getUnitBaseProperties(child));
                        }
                        if (name === transformEnums_1.ProtectedUnitProperties.SkipUnit) {
                            if (getSkipValue(child)) {
                                skip = true;
                            }
                        }
                        if (name === transformEnums_1.ProtectedUnitProperties.CustomProperties) {
                            customProps = Object.assign(Object.assign({}, customProps), getCustomProperties(child));
                        }
                    }
                });
            }
            const filePath = getCleanedFilePath(node);
            if (!skip) {
                const unitList = curUnits.get(filePath);
                if (!unitList)
                    return;
                if (!props) {
                    if (transform_1.configuration.strict === "warn" /* Warn */) {
                        console.log("\x1b[93m%s\x1b[0m", `[Ability Transformer] No properties for '${name}'. Skipping.`);
                    }
                    if (transform_1.configuration.strict === "error" /* Error */) {
                        throw new transform_1.TransformerError(`No properties for '${name}'. Aborting.`);
                    }
                    return;
                }
                unitList.add({
                    name,
                    scriptFile: filePath,
                    properties: props,
                    abilities: abilities,
                    customProperties: customProps,
                });
            }
            else {
                transform_1.debugPrint("Skipped unit creation for: " + name);
            }
        }
    }
}
function getClassHeritages(node, typeChecker) {
    let superClasses = [];
    const clauses = node.heritageClauses;
    if (clauses) {
        for (const clause of clauses) {
            const types = clause.types;
            types.forEach((clauseType) => {
                const exp = clauseType.expression;
                if (exp.getText() in transformEnums_1.BaseClasses) {
                    return;
                }
                const type = typeChecker.getTypeAtLocation(exp);
                if (!type.symbol.declarations)
                    return;
                const declaration = type.symbol.declarations[0];
                if (ts.isClassDeclaration(declaration)) {
                    superClasses = superClasses.concat(getClassHeritages(declaration, typeChecker));
                }
            });
        }
    }
    superClasses.push(node);
    return superClasses;
}
function hasNamedEntry(name, obj) {
    let found = false;
    obj.forEach((entryName) => {
        if (entryName.name === name) {
            found = true;
            return;
        }
    });
    return found;
}
function getFileCountByFolder(absPath, map) {
    const curModuleName = getModuleName(absPath);
    let count = 0;
    for (const [filePath, names] of map) {
        if (filePath === absPath)
            continue;
        const namesSet = names;
        if (namesSet.size === 0)
            continue;
        const moduleName = getModuleName(filePath);
        if (moduleName === curModuleName)
            count++;
    }
    return count;
}
function updateTypes(type) {
    const entries = [];
    let content = "";
    if (type === "Ability" /* Ability */) {
        curAbilityNames.forEach((name) => {
            entries.push(`${name} = "${name}"`);
        });
        content = BASE_TYPE[type].replace("$", entries.join(",\n\t") + ",");
    }
    else {
        curUnitNames.forEach((name) => {
            entries.push(`${name}: ${name}`);
        });
        const ignore = "//@ts-ignore\n\t";
        content = BASE_TYPE[type].replace("$", ignore + entries.join(`,\n\t${ignore}`) + ";");
    }
    try {
        fs.writeFileSync(GENERATED_TYPES_PATH[type], content);
    }
    catch (_a) {
        // Done
    }
}
/**
 * Check if this node should be deleted.
 * @param node node to check
 * @returns node. undefined if it has to be removed
 */
const removeNode = (node) => {
    if (ts.isPropertyDeclaration(node)) {
        const name = getNodeName(node);
        if (name in transformEnums_1.ProtectedAbilityProperties)
            return;
        if (name in transformEnums_1.ProtectedUnitProperties)
            return;
    }
    return node;
};
/**
 * Creates the transformer.
 */
const createDotaTransformer = (program) => (context) => {
    const tsConfig = transform_1.setTsConfig(program);
    const preEmitDiagnostics = [...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics()];
    if (tsConfig) {
        checkDeclarations_1.validateNettables(tsConfig.rootDir, tsConfig.output);
        // validateCustomGameevents(tsConfig.rootDir, tsConfig.output, program);
    }
    inititialize();
    const visit = (node) => {
        if (transform_1.configuration.disable === true)
            return node;
        checkNode(node, program);
        if (!removeNode(node))
            return;
        return ts.visitEachChild(node, visit, context);
    };
    return (file) => {
        // console.log("In?");
        // if (preEmitDiagnostics.length > 0 || curError) {
        // 	curError = true;
        // 	return file;
        // }
        // preEmitDiagnostics.push(...program.getSyntacticDiagnostics(file));
        // preEmitDiagnostics.push(...program.getSemanticDiagnostics(file));
        // preEmitDiagnostics.push(...program.getDeclarationDiagnostics());
        // if (preEmitDiagnostics.length > 0 || curError) {
        // 	curError = true;
        // 	return file;
        // }
        // curError = false;
        var _a, _b;
        const fileName = getCleanedFilePath(file);
        let fileAbilities = (_a = abilityMap.get(fileName)) !== null && _a !== void 0 ? _a : new Set();
        curAbilities.set(fileName, new Set());
        let fileUnits = (_b = unitMap.get(fileName)) !== null && _b !== void 0 ? _b : new Set();
        curUnits.set(fileName, new Set());
        const res = ts.visitNode(file, visit);
        const curFileAbilities = curAbilities.get(fileName);
        fileAbilities.forEach((abilityName) => {
            if (!hasNamedEntry(abilityName, curFileAbilities)) {
                let remBase = false;
                if (transform_1.configuration.modularization !== "none" /* None */) {
                    remBase = curFileAbilities.size === 0;
                }
                if (transform_1.configuration.modularization === "folder" /* Folder */ && remBase) {
                    const count = getFileCountByFolder(fileName, abilityMap);
                    remBase = count === 0;
                }
                removeAbility(fileName, abilityName, remBase);
            }
        });
        fileAbilities = new Set();
        curFileAbilities.forEach((ability) => {
            writeAbility(ability);
            fileAbilities.add(ability.name);
        });
        abilityMap.set(fileName, fileAbilities);
        const curFileUnits = curUnits.get(fileName);
        fileUnits.forEach((unitName) => {
            if (!hasNamedEntry(unitName, curFileUnits)) {
                let remBase = false;
                if (transform_1.configuration.modularization !== "none" /* None */) {
                    remBase = curFileUnits.size === 0;
                }
                if (transform_1.configuration.modularization === "folder" /* Folder */ && remBase) {
                    const count = getFileCountByFolder(fileName, unitMap);
                    remBase = count === 0;
                }
                removeUnit(fileName, unitName, remBase);
            }
        });
        fileUnits = new Set();
        curFileUnits.forEach((unit) => {
            writeUnit(unit);
            fileUnits.add(unit.name);
        });
        unitMap.set(fileName, fileUnits);
        return res;
    };
};
exports.default = createDotaTransformer;
