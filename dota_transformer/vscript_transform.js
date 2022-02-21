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
const transformEnums_1 = require("dota_transformer/transformEnums");
const checkDeclarations_1 = require("dota_transformer/checkDeclarations");
const transform_1 = require("dota_transformer/transform");
const GENERATED_FILE_NAME = "/generatedAbilities.kv";
const GENERATED_FILE_PATH = "generatedAbilities";
const BASE_NPC_ABILITY_FILE = `
#base "heroes/meepo.kv"

"DOTAAbilities"
{
}`;
const BASE_ABILITY_OBJECT = `
"DOTAAbilities"
{
}`;
const GENERATED_TYPES_PATH_ABILITIES = path.join(__dirname, "_generated", "abilities.d.ts");
const BASE_ABILITY_TYPE = `
declare const enum Abilities {
	$,
}`;
const abilityMap = new Map();
const curAbilities = new Map();
const curAbilityNames = new Set();
let curError = false;
/**
 * Get the path to the ability directory inside "scripts/npc"
 * @returns ability path
 */
function getAbilityPath() {
    const vPath = transform_1.getTsConfig().output;
    const abilityDir = path.resolve(vPath, "../npc");
    if (!fs.existsSync(abilityDir))
        throw new transform_1.AbilityTransformerError("NPC script path not found");
    const genPath = abilityDir + "/abilities";
    if (!fs.existsSync(genPath))
        fs.mkdirSync(genPath);
    return genPath;
}
/**
 * Get the file path of an ability based on the current node.
 * @param node current node
 * @returns current node file path (relative from "vscripts")
 */
function getCleanedFilePath(node) {
    const rootPath = transform_1.getTsConfig().rootDir;
    const absPath = ts.getOriginalNode(node).getSourceFile().fileName;
    const cleanedPath = absPath.substring(absPath.indexOf(rootPath) + rootPath.length + 1);
    return cleanedPath.replace(".ts", "");
    // const match = absPath.match(/.*vscripts[\/\\](.*)\.ts/);
    // if (!match) throw new AbilityTransformerError("Invalid File Path: " + absPath);
    // return match[1] + ".lua";
}
/**
 * Get all currently generated abilities.
 * @returns generated abilities object
 */
function getAllGeneratedAbilities() {
    const abilityPath = getAbilityPath();
    const abilityFilePath = abilityPath + GENERATED_FILE_NAME;
    if (!fs.existsSync(abilityFilePath)) {
        transform_1.debugPrint("Failed to find " + GENERATED_FILE_NAME);
        return;
    }
    return valve_kv_1.deserializeFile(abilityFilePath);
}
/**
 * Get all currently generated abilities.
 * @returns generated abilities object
 */
function getGeneratedAbilities(absPath) {
    const abilityFilePath = getAbilityPathName(absPath);
    if (!fs.existsSync(abilityFilePath)) {
        transform_1.debugPrint("Failed to find " + abilityFilePath);
        return;
    }
    return valve_kv_1.deserializeFile(abilityFilePath);
}
/**
 * Writes the information of this ability object to a file, based on current configuration.
 * @param absPath orig file path (to determine modularization)
 * @param abilityObject ability object to write
 */
function writeGeneratedAbilities(absPath, abilityObject) {
    const abilityStr = valve_kv_1.serialize({ DOTAAbilities: abilityObject });
    const abilityFilePath = getAbilityPathName(absPath);
    transform_1.debugPrint("Write to " + abilityFilePath);
    fs.writeFileSync(abilityFilePath, abilityStr);
    addBase(absPath);
}
/**
 * Writes the information of this ability object to a file.
 * Never uses modularization.
 * @param abilityObject
 */
function writeAllGeneratedAbilities(abilityObject) {
    const abilityStr = valve_kv_1.serialize({ DOTAAbilities: abilityObject });
    const abilityPath = getAbilityPath() + GENERATED_FILE_NAME;
    transform_1.debugPrint("Write all abilities");
    fs.writeFileSync(abilityPath, abilityStr);
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
function getAbilityPathName(absPath) {
    const abilityPath = getAbilityPath();
    let abilityFilePath;
    switch (transform_1.configuration.modularization) {
        case "none" /* None */:
            abilityFilePath = abilityPath + GENERATED_FILE_NAME;
            break;
        case "file" /* File */:
        case "folder" /* Folder */:
            const moduleName = getModuleName(absPath);
            abilityFilePath = path.resolve(abilityPath, GENERATED_FILE_PATH, moduleName + ".kv");
    }
    return abilityFilePath;
}
/**
 * Add a new base to the generatedAbilities.kv file.
 * Checks if the base already exists.
 * @param absPath abs path of the ability
 */
function addBase(absPath) {
    transform_1.debugPrint("Check bases [Add]");
    if (transform_1.configuration.modularization === "none" /* None */)
        return;
    const moduleName = getModuleName(absPath);
    const curBases = getBases();
    if (curBases.includes(moduleName)) {
        transform_1.debugPrint("Base " + moduleName + " already included");
        return;
    }
    writeBases([...curBases, moduleName]);
}
/**
 * Remove a base from the generatedAbilities.kv file.
 * Checks if the base actually exists.
 * @param absPath abs path of the ability
 */
function removeBase(absPath) {
    transform_1.debugPrint("Check bases [Remove]");
    if (transform_1.configuration.modularization === "none" /* None */)
        return;
    const moduleName = getModuleName(absPath);
    const curBases = getBases();
    if (!curBases.includes(moduleName)) {
        transform_1.debugPrint("Base " + moduleName + " not included");
        return;
    }
    writeBases(curBases.filter((base) => base !== moduleName));
}
/**
 * Checks whether the generated ability kv is already included in the base abilities file.
 * If not, it includes it.
 */
function checkAbilityBase() {
    const abilityPath = getAbilityPath();
    const baseAbilityFilePath = abilityPath + "/../npc_abilities_custom.txt";
    transform_1.debugPrint("Check if " + GENERATED_FILE_NAME + " is already included as base");
    if (!fs.existsSync(baseAbilityFilePath)) {
        fs.writeFileSync(baseAbilityFilePath, BASE_NPC_ABILITY_FILE);
    }
    else {
        const baseAbilityFile = fs.readFileSync(baseAbilityFilePath).toString();
        const regex = /^#base\s+["'](.*)["']/gm;
        let match;
        const includedFiles = [];
        while ((match = regex.exec(baseAbilityFile)) !== null) {
            if (!match)
                continue;
            includedFiles.push(match[1]);
        }
        if (!includedFiles.includes("abilities/generatedAbilities.kv")) {
            fs.writeFileSync(baseAbilityFilePath, `#base "abilities/generatedAbilities.kv"\n${baseAbilityFile}`);
        }
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
    console.log("[Ability Transformer] Initialize...");
    checkAbilityBase();
    let origfileContent;
    try {
        origfileContent = getAllGeneratedAbilities();
    }
    catch (_b) {
        transform_1.debugPrint("Failed to read " + GENERATED_FILE_NAME);
    }
    let fileContent = {};
    if (!origfileContent || Object.keys(origfileContent).length === 0) {
        transform_1.debugPrint(GENERATED_FILE_NAME + " is empty or not found");
        const abilityPath = `${getAbilityPath()}${GENERATED_FILE_NAME}`;
        fs.writeFileSync(abilityPath, BASE_ABILITY_OBJECT);
        if (transform_1.configuration.modularization !== "none" /* None */) {
            const abilityBasePath = `${getAbilityPath()}/${GENERATED_FILE_PATH}`;
            if (!fs.existsSync(abilityBasePath))
                fs.mkdirSync(abilityBasePath);
        }
        console.log("\x1b[32m%s\x1b[0m", "[Ability Transformer] Initialization complete!\n");
        return;
    }
    else {
        fileContent = origfileContent.DOTAAbilities;
    }
    for (const [key, value] of Object.entries(fileContent)) {
        const fileName = value["ScriptFile"];
        if (!fileName)
            continue;
        let abilitySet = abilityMap.get(fileName);
        if (!abilitySet)
            abilitySet = new Set();
        abilitySet.add(key);
        abilityMap.set(fileName, abilitySet);
    }
    const bases = getBases();
    // Adjust the bases to the current configuration
    switch (transform_1.configuration.modularization) {
        case "none" /* None */: {
            transform_1.debugPrint("Switch to modularization: " + transform_1.configuration.modularization);
            if (bases.length > 0) {
                writeAllGeneratedAbilities(fileContent);
            }
            const abilityBasePath = `${getAbilityPath()}/${GENERATED_FILE_PATH}`;
            if (fs.existsSync(abilityBasePath)) {
                fs.rmdirSync(abilityBasePath, { recursive: true });
            }
            break;
        }
        case "file" /* File */:
        case "folder" /* Folder */:
            transform_1.debugPrint("Switch to modularization: " + transform_1.configuration.modularization);
            const abilityBasePath = `${getAbilityPath()}/${GENERATED_FILE_PATH}`;
            if (!fs.existsSync(abilityBasePath)) {
                fs.mkdirSync(abilityBasePath);
            }
            else {
                fs.rmdirSync(abilityBasePath, { recursive: true });
                fs.mkdirSync(abilityBasePath);
            }
            const moduleMap = new Map();
            for (const [key, value] of Object.entries(fileContent)) {
                const fileName = value["ScriptFile"];
                if (!fileName)
                    continue;
                const moduleName = getModuleName(fileName);
                const curModules = (_a = moduleMap.get(moduleName)) !== null && _a !== void 0 ? _a : {};
                curModules[key] = value;
                moduleMap.set(moduleName, curModules);
            }
            transform_1.debugPrint("Write new modularized ability files...");
            const newBases = [];
            moduleMap.forEach((value, key) => {
                newBases.push(key);
                const abilityStr = valve_kv_1.serialize({ DOTAAbilities: value });
                const abilityPath = abilityBasePath + `/${key}.kv`;
                fs.writeFileSync(abilityPath, abilityStr);
            });
            writeBases(newBases);
            break;
    }
    console.log("\x1b[32m%s\x1b[0m", "[Ability Transformer] Initialization complete!\n");
}
/**
 * Get all current bases for the modularization.
 * @returns
 */
function getBases() {
    transform_1.debugPrint("Get current bases");
    const abilityPath = getAbilityPath();
    const abilityFilePath = abilityPath + GENERATED_FILE_NAME;
    if (!fs.existsSync(abilityFilePath))
        return [];
    const content = fs.readFileSync(abilityFilePath, "utf-8");
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
function writeBases(bases) {
    let basesString = "";
    for (const base of bases) {
        basesString += `#base "${GENERATED_FILE_PATH}/${base}.kv"\n`;
    }
    basesString += BASE_ABILITY_OBJECT;
    const abilityPath = `${getAbilityPath()}${GENERATED_FILE_NAME}`;
    transform_1.debugPrint("Refresh bases");
    fs.writeFileSync(abilityPath, basesString);
}
/**
 * Create the ability text from the given information and update the ability kvs.
 * @param name name of the ability
 * @param scriptFile scripts file path
 * @param properties base properties of the the ability
 * @param specials ability special values
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
    const origfileContent = getGeneratedAbilities(ability.scriptFile);
    let fileContent = {};
    if (origfileContent) {
        fileContent = origfileContent.DOTAAbilities;
    }
    fileContent[ability.name] = kvAbility;
    writeGeneratedAbilities(ability.scriptFile, fileContent);
    curAbilityNames.add(ability.name);
    updateAbilityTypes();
}
/**
 * Remove an ability from the KV ability file.
 * @param abilityName name of the ability
 */
function removeAbility(absPath, abilityName, remBase) {
    transform_1.debugPrint("Remove ability: " + abilityName);
    const origfileContent = getGeneratedAbilities(absPath);
    const abilityFilePath = getAbilityPathName(absPath);
    let fileContent = {};
    if (origfileContent) {
        fileContent = origfileContent.DOTAAbilities;
    }
    delete fileContent[abilityName];
    if (remBase)
        removeBase(absPath);
    if (Object.keys(fileContent).length === 0 && transform_1.configuration.modularization !== "none" /* None */) {
        fs.unlinkSync(abilityFilePath);
        return;
    }
    const abilityStr = valve_kv_1.serialize({ DOTAAbilities: fileContent });
    fs.writeFileSync(abilityFilePath, abilityStr);
    curAbilityNames.delete(abilityName);
    updateAbilityTypes();
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
                else {
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
function getBaseProperties(node) {
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
        else {
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
        properties[name] = Array.isArray(val) ? val.join(" ") : val;
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
/**
 * Check if a node is an ability class and write it.
 * @param node node to check
 */
function checkNode(node) {
    if (ts.isClassDeclaration(node)) {
        const decorators = node.decorators;
        if (!decorators)
            return;
        for (const deco of decorators) {
            const decoInfo = getDecoratorInfo(deco);
            if (!decoInfo)
                return;
            if (decoInfo.name !== "registerAbility")
                return;
        }
        if (!node.name)
            return;
        const name = node.name.escapedText.toString();
        let values;
        let props;
        let customProps;
        let skip = false;
        node.forEachChild((child) => {
            if (ts.isPropertyDeclaration(child)) {
                const name = getNodeName(child);
                if (name === transformEnums_1.ProtectedProperties.SpecialValues) {
                    values = getSpecialValues(child);
                }
                if (name === transformEnums_1.ProtectedProperties.BaseProperties) {
                    props = getBaseProperties(child);
                }
                if (name === transformEnums_1.ProtectedProperties.SkipAbility) {
                    skip = getSkipValue(child);
                }
                if (name === transformEnums_1.ProtectedProperties.CustomProperties) {
                    customProps = getCustomProperties(child);
                }
            }
        });
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
                    throw new transform_1.AbilityTransformerError(`No properties for '${name}'. Aborting.`);
                }
                return;
            }
            abilityList.add({
                name,
                scriptFile: filePath,
                properties: props !== null && props !== void 0 ? props : {},
                specials: values !== null && values !== void 0 ? values : [],
                customProperties: customProps !== null && customProps !== void 0 ? customProps : {},
            });
        }
        else {
            transform_1.debugPrint("Skipped ability creation for: " + name);
        }
    }
}
function hasAbility(abilityName, abilities) {
    let found = false;
    abilities.forEach((ability) => {
        if (ability.name === abilityName) {
            found = true;
            return;
        }
    });
    return found;
}
function getAbilityFileCountByFolder(absPath) {
    const curModuleName = getModuleName(absPath);
    let count = 0;
    for (const [filePath, names] of abilityMap) {
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
function updateAbilityTypes() {
    // console.log("UPDATE!!");
    const entries = [];
    curAbilityNames.forEach((name) => {
        entries.push(`${name} = "${name}"`);
    });
    const content = BASE_ABILITY_TYPE.replace("$", entries.join(",\n\t"));
    try {
        fs.writeFileSync(GENERATED_TYPES_PATH_ABILITIES, content);
    }
    catch (_a) {
        // Done
        console.log(path.resolve(GENERATED_TYPES_PATH_ABILITIES));
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
        if (name in transformEnums_1.ProtectedProperties)
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
        checkNode(node);
        if (!removeNode(node))
            return;
        return ts.visitEachChild(node, visit, context);
    };
    return (file) => {
        var _a;
        if (preEmitDiagnostics.length > 0 || curError) {
            curError = true;
            return file;
        }
        preEmitDiagnostics.push(...program.getSyntacticDiagnostics(file));
        preEmitDiagnostics.push(...program.getSemanticDiagnostics(file));
        preEmitDiagnostics.push(...program.getDeclarationDiagnostics());
        if (preEmitDiagnostics.length > 0 || curError) {
            curError = true;
            return file;
        }
        curError = false;
        const fileName = getCleanedFilePath(file);
        let fileAbilities = (_a = abilityMap.get(fileName)) !== null && _a !== void 0 ? _a : new Set();
        curAbilities.set(fileName, new Set());
        const res = ts.visitNode(file, visit);
        const curFileAbilities = curAbilities.get(fileName);
        fileAbilities.forEach((abilityName) => {
            if (!hasAbility(abilityName, curFileAbilities)) {
                let remBase = false;
                if (transform_1.configuration.modularization !== "none" /* None */) {
                    remBase = curFileAbilities.size === 0;
                }
                if (transform_1.configuration.modularization === "folder" /* Folder */ && remBase) {
                    const count = getAbilityFileCountByFolder(fileName);
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
        return res;
    };
};
exports.default = createDotaTransformer;
