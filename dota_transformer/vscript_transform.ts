import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
const node_modules = require("node_modules-path");
import { KVObject, serialize, deserializeFile, KVValue, isKvObject } from "valve-kv";
import {
	DifferentlyNamedAbilityKVs,
	DifferentlyNamesEnums,
	NumericBaseProperties,
	LinkedSpecialBonusOperationNames,
	SpellImmunityTypesNames,
	SpellDispellableTypesNames,
	AbilityCastGestureSlotValueNames,
	ProtectedAbilityProperties,
	ProtectedUnitProperties,
} from "dota_transformer_pkg/transformEnums";
import { validateNettables } from "dota_transformer_pkg/checkDeclarations";
import {
	getTsConfig,
	setTsConfig,
	getConfiguration,
	TransformerError,
	debugPrint,
	configuration,
	isInt,
	isNumber,
	isNumberArr,
} from "dota_transformer_pkg/transform";

const GENERATED_FILE_NAME = {
	[FileType.Ability]: "/generatedAbilities.kv",
	[FileType.Unit]: "/generatedUnits.kv",
};
const GENERATED_FILE_PATH = {
	[FileType.Ability]: "generatedAbilities",
	[FileType.Unit]: "generatedUnits",
};
const BASE_NAME = {
	[FileType.Ability]: "DOTAAbilities",
	[FileType.Unit]: "DOTAUnits",
};
const PATH_ADDITION = {
	[FileType.Ability]: "/abilities",
	[FileType.Unit]: "/units",
};
const PATH_BASE_FILE = {
	[FileType.Ability]: "/../npc_abilities_custom.txt",
	[FileType.Unit]: "/../npc_units_custom.txt",
};
const BASE_OBJECT = (type: FileType) => `"${BASE_NAME[type]}"\n{\n}`;

const GENERATED_TYPES_PATH = {
	[FileType.Ability]: path.join(__dirname, "_generated", "abilities.d.ts"),
	[FileType.Unit]: path.join(__dirname, "_generated", "units.d.ts"),
};

const BASE_TYPE = {
	[FileType.Ability]: `
declare const enum CustomAbilities {
	$
}`,
	[FileType.Unit]: `
interface CustomUnits {
	$
}`,
};

const abilityMap: Map<string, Set<string>> = new Map();
const curAbilities: Map<string, Set<AbilityInformation>> = new Map();
const curAbilityNames: Set<string> = new Set();

const unitMap: Map<string, Set<string>> = new Map();
const curUnits: Map<string, Set<UnitInformation>> = new Map();
const curUnitNames: Set<string> = new Set();

let curError = false;

/**
 * Get the path to the directory inside "scripts/npc"
 * @returns dir path
 */
function getBasePath(type: FileType): string {
	const vPath = getTsConfig().output;
	const baseDir = path.resolve(vPath, "../npc");
	if (!fs.existsSync(baseDir)) throw new TransformerError("NPC script path not found");
	const genPath = baseDir + PATH_ADDITION[type];
	if (!fs.existsSync(genPath)) fs.mkdirSync(genPath);
	return genPath;
}

/**
 * Get the file path of an object based on the current node.
 * @param node current node
 * @returns current node file path (relative from "vscripts")
 */
function getCleanedFilePath(node: ts.Node): string {
	const rootPath = getTsConfig().rootDir;
	const absPath = ts.getOriginalNode(node).getSourceFile().fileName;
	const cleanedPath = absPath.substring(absPath.indexOf(rootPath) + rootPath.length + 1);
	return cleanedPath.replace(".ts", "");
}

/**
 * Get all currently generated objects.
 * @returns generated objects
 */
function getAllGeneratedObjects(type: FileType): KVObject | undefined {
	const thisPath = getBasePath(type);
	const filePath = thisPath + GENERATED_FILE_NAME[type];
	if (!fs.existsSync(filePath)) {
		debugPrint("Failed to find " + GENERATED_FILE_NAME[type]);
		return;
	}
	return deserializeFile(filePath);
}

/**
 * Get all currently generated objects.
 * @returns generated objects
 */
function getGeneratedObjects(type: FileType, absPath: string): KVObject | undefined {
	const filePath = getPathName(type, absPath);
	if (!fs.existsSync(filePath)) {
		debugPrint("Failed to find " + filePath);
		return;
	}
	return deserializeFile(filePath);
}

/**
 * Writes the information of this object to a file, based on current configuration.
 * @param absPath orig file path (to determine modularization)
 * @param obj object to write
 */
function writeGeneratedObjects(type: FileType, absPath: string, obj: KVObject) {
	const content = serialize({ [BASE_NAME[type]]: obj });
	const filePath = getPathName(type, absPath);
	debugPrint("Write to " + filePath);
	fs.writeFileSync(filePath, content);
	addBase(type, absPath);
}

/**
 * Writes the information of this ability object to a file.
 * Never uses modularization.
 * @param obj
 */
function writeAllGeneratedObjects(type: FileType, obj: KVObject) {
	const content = serialize({ [BASE_NAME[type]]: obj });
	const filePath = getBasePath(type) + GENERATED_FILE_NAME[type];
	debugPrint(`Write all objects [${type}]`);
	fs.writeFileSync(filePath, content);
}

/**
 * Get the name of the module for this path. Only relevant if the modularization is not none.
 * @param filePath path to get the module name
 * @returns module name
 */
function getModuleName(filePath: string): string {
	switch (configuration.modularization) {
		case ModularizationType.None:
			return "";
		case ModularizationType.File: {
			const match = filePath.match(/(^.*[\/\\])?(\w+)(\.lua)?/);
			return match ? match[2] : "root";
		}
		case ModularizationType.Folder: {
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
function getPathName(type: FileType, absPath: string): string {
	const thisPath = getBasePath(type);
	let filePath: string;
	switch (configuration.modularization) {
		case ModularizationType.None:
			filePath = thisPath + GENERATED_FILE_NAME[type];
			break;
		case ModularizationType.File:
		case ModularizationType.Folder:
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
function addBase(type: FileType, absPath: string) {
	debugPrint("Check bases [Add]");
	if (configuration.modularization === ModularizationType.None) return;
	const moduleName = getModuleName(absPath);
	const curBases = getBases(type);
	if (curBases.includes(moduleName)) {
		debugPrint("Base " + moduleName + " already included");
		return;
	}
	writeBases(type, [...curBases, moduleName]);
}

/**
 * Remove a base from the generatedAbilities.kv file.
 * Checks if the base actually exists.
 * @param absPath abs path of the ability
 */
function removeBase(type: FileType, absPath: string) {
	debugPrint("Check bases [Remove]");
	if (configuration.modularization === ModularizationType.None) return;
	const moduleName = getModuleName(absPath);
	const curBases = getBases(type);
	if (!curBases.includes(moduleName)) {
		debugPrint("Base " + moduleName + " not included");
		return;
	}
	writeBases(
		type,
		curBases.filter((base) => base !== moduleName)
	);
}

/**
 * Checks whether the generated object kv is already included in the base file.
 * If not, it includes it.
 */
function checkBase(type: FileType) {
	const basePath = getBasePath(type);
	const baseFilePath = basePath + PATH_BASE_FILE[type];
	debugPrint("Check if " + GENERATED_FILE_NAME[type] + " is already included as base");
	if (!fs.existsSync(baseFilePath)) {
		fs.writeFileSync(baseFilePath, BASE_OBJECT(type));
	} else {
		const baseFile = fs.readFileSync(baseFilePath).toString();
		const regex = /^#base\s+["'](.*)["']/gm;
		let match: RegExpExecArray | null;
		const includedFiles: string[] = [];
		while ((match = regex.exec(baseFile)) !== null) {
			if (!match) continue;
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
function getSourceFileName(type: FileType, obj: KVObject): string | undefined {
	if (type === FileType.Ability) {
		return obj["ScriptFile"] as string | undefined;
	} else {
		const content = obj["vscripts"] as string | undefined;
		if (!content) return;
		return content.replace(".lua", "");
	}
}

let initialized = false;
/**
 * Check what abilities are currently defined already.
 */
function inititialize() {
	if (initialized === true) return;
	initialized = true;

	getConfiguration();
	if (configuration.disable === true) return;

	console.log("[Dota Transformer] Initialize...");

	for (const type of [FileType.Ability, FileType.Unit]) {
		checkBase(type);

		let origfileContent: KVObject | undefined;
		try {
			origfileContent = getAllGeneratedObjects(type);
		} catch {
			debugPrint("Failed to read " + GENERATED_FILE_NAME[type]);
		}
		let fileContent: KVObject = {};
		if (!origfileContent || Object.keys(origfileContent).length === 0) {
			debugPrint(GENERATED_FILE_NAME[type] + " is empty or not found");
			const thisPath = `${getBasePath(type)}${GENERATED_FILE_NAME[type]}`;
			fs.writeFileSync(thisPath, BASE_OBJECT(type));

			if (configuration.modularization !== ModularizationType.None) {
				const basePath = `${getBasePath(type)}/${GENERATED_FILE_PATH[type]}`;
				if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
			}

			console.log("\x1b[32m%s\x1b[0m", "[Dota Transformer] Initialization complete!\n");
			return;
		} else {
			fileContent = origfileContent[BASE_NAME[type]] as KVObject;
		}
		for (const [key, value] of Object.entries(fileContent)) {
			const fileName = getSourceFileName(type, value as KVObject);
			if (!fileName) continue;
			if (type === FileType.Ability) {
				let abilitySet = abilityMap.get(fileName);
				if (!abilitySet) abilitySet = new Set();
				abilitySet.add(key);
				abilityMap.set(fileName, abilitySet);
			} else {
				let unitSet = unitMap.get(fileName);
				if (!unitSet) unitSet = new Set();
				unitSet.add(key);
				unitMap.set(fileName, unitSet);
			}
		}
		const bases = getBases(type);

		// Adjust the bases to the current configuration
		switch (configuration.modularization) {
			case ModularizationType.None: {
				debugPrint("Switch to modularization: " + configuration.modularization);
				if (bases.length > 0) {
					writeAllGeneratedObjects(type, fileContent);
				}
				const basePath = `${getBasePath(type)}/${GENERATED_FILE_PATH[type]}`;
				if (fs.existsSync(basePath)) {
					fs.rmdirSync(basePath, { recursive: true });
				}
				break;
			}
			case ModularizationType.File:
			case ModularizationType.Folder:
				debugPrint("Switch to modularization: " + configuration.modularization);
				const basePath = `${getBasePath(type)}/${GENERATED_FILE_PATH[type]}`;
				if (!fs.existsSync(basePath)) {
					fs.mkdirSync(basePath);
				} else {
					fs.rmdirSync(basePath, { recursive: true });
					fs.mkdirSync(basePath);
				}

				const moduleMap: Map<string, KVObject> = new Map();
				for (const [key, value] of Object.entries(fileContent)) {
					const fileName = getSourceFileName(type, value as KVObject);
					if (!fileName) continue;
					const moduleName = getModuleName(fileName);
					const curModules = moduleMap.get(moduleName) ?? ({} as KVObject);
					curModules[key] = value;
					moduleMap.set(moduleName, curModules);
				}

				debugPrint(`Write new modularized ${type} files...`);
				const newBases: string[] = [];
				moduleMap.forEach((value, key) => {
					newBases.push(key);
					const content = serialize({ [BASE_NAME[type]]: value });
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
function getBases(type: FileType): string[] {
	debugPrint("Get current bases");
	const finalFilePath = getBasePath(type) + GENERATED_FILE_PATH[type];
	if (!fs.existsSync(finalFilePath)) return [];
	const content = fs.readFileSync(finalFilePath, "utf-8");
	const regex = /^#base\s+\".*?\/(.*).kv\"/gm;
	let match: RegExpExecArray | null;
	const bases: string[] = [];
	while ((match = regex.exec(content)) !== null) {
		bases.push(match[1]);
	}
	return bases;
}

/**
 * Write the bases for a .kv file.
 * @param bases list of bases
 */
function writeBases(type: FileType, bases: string[]) {
	let basesString = "";
	for (const base of bases) {
		basesString += `#base "${GENERATED_FILE_PATH[type]}/${base}.kv"\n`;
	}
	basesString += BASE_OBJECT(type);
	const filePath = `${getBasePath(type)}${GENERATED_FILE_NAME[type]}`;
	debugPrint("Refresh bases");
	fs.writeFileSync(filePath, basesString);
}

/**
 * Create the ability text from the given information and update the ability kvs.
 * @param ability ability Information
 */
function writeAbility(ability: AbilityInformation) {
	debugPrint("Prepare write of ability");
	const formattedSpecials: { [name: string]: { [name: string]: string } } = {};
	for (let i = 0; i < ability.specials.length; i++) {
		const special = ability.specials[i];
		const index = (i + 1).toString().padStart(2, "0");
		const formattedValue = Array.isArray(special.value) ? special.value.join(" ") : special.value.toString();
		const otherFields: { [name: string]: string } = {};
		for (const [name, val] of Object.entries(special)) {
			if (name === "name" || name === "type" || name === "value") continue;
			otherFields[name] = val;
		}
		formattedSpecials[index] = {
			var_type: special.type,
			[special.name]: formattedValue,
			...otherFields,
		};
	}
	const replacedProperties: { [name: string]: string } = {};
	for (const [name, val] of Object.entries(ability.properties)) {
		const replacedName = DifferentlyNamedAbilityKVs[name as keyof typeof DifferentlyNamedAbilityKVs] ?? name;
		replacedProperties[replacedName] = val;
	}
	const kvAbility: KVObject = {
		BaseClass: "ability_lua",
		ScriptFile: ability.scriptFile,
		...replacedProperties,
		...ability.customProperties,
	};
	if (ability.specials.length > 0) {
		kvAbility.AbilitySpecial = {
			...formattedSpecials,
		};
	}
	const origfileContent = getGeneratedObjects(FileType.Ability, ability.scriptFile);
	let fileContent: KVObject = {};
	if (origfileContent) {
		fileContent = origfileContent.DOTAAbilities as KVObject;
	}
	fileContent[ability.name] = kvAbility;
	writeGeneratedObjects(FileType.Ability, ability.scriptFile, fileContent);

	curAbilityNames.add(ability.name);
	updateTypes(FileType.Ability);
}

/**
 * Remove an ability from the KV ability file.
 * @param absPath absolute path of the ability
 * @param abilityName name of the ability
 * @param remBase should the base be removed?
 */
function removeAbility(absPath: string, abilityName: string, remBase: boolean) {
	debugPrint("Remove ability: " + abilityName);
	const origfileContent = getGeneratedObjects(FileType.Ability, absPath);
	const abilityFilePath = getPathName(FileType.Ability, absPath);
	let fileContent: KVObject = {};
	if (origfileContent) {
		fileContent = origfileContent.DOTAAbilities as KVObject;
	}
	delete fileContent[abilityName];
	if (remBase) removeBase(FileType.Ability, absPath);
	if (Object.keys(fileContent).length === 0 && configuration.modularization !== ModularizationType.None) {
		fs.unlinkSync(abilityFilePath);
		return;
	}
	const abilityStr = serialize({ DOTAAbilities: fileContent });
	fs.writeFileSync(abilityFilePath, abilityStr);

	curAbilityNames.delete(abilityName);
	updateTypes(FileType.Ability);
}

/**
 * Create the unit text from the given information and update the unit kvs.
 * @param unit unit Information
 */
function writeUnit(unit: UnitInformation) {
	debugPrint("Prepare write of unit");
	const abilities: { [name: string]: string } = {};
	for (const [index, name] of Object.entries(unit.abilities)) {
		abilities[`Ability${index}`] = name;
	}

	const baseClass = unit.properties.BaseClass;
	const newProperties: { [name: string]: string | object } = unit.properties;
	delete newProperties.BaseClass;
	const kvUnit: KVObject = {
		BaseClass: baseClass,
		...abilities,
		...newProperties,
		...unit.customProperties,
		vscripts: `${unit.scriptFile}.lua`,
	};
	const origfileContent = getGeneratedObjects(FileType.Unit, unit.scriptFile);
	let fileContent: KVObject = {};
	if (origfileContent) {
		fileContent = origfileContent.DOTAUnits as KVObject;
	}
	fileContent[unit.name] = kvUnit;
	writeGeneratedObjects(FileType.Unit, unit.scriptFile, fileContent);

	curUnitNames.add(unit.name);
	updateTypes(FileType.Unit);
}

/**
 * Remove an unit from the KV ability file.
 * @param absPath absolute path of the unit
 * @param unitName name of the unit
 * @param remBase should the base be removed?
 */
function removeUnit(absPath: string, unitName: string, remBase: boolean) {
	debugPrint("Remove unit: " + unitName);
	const origfileContent = getGeneratedObjects(FileType.Unit, absPath);
	const unitFilePath = getPathName(FileType.Unit, absPath);
	let fileContent: KVObject = {};
	if (origfileContent) {
		fileContent = origfileContent.DOTAUnits as KVObject;
	}
	delete fileContent[unitName];
	if (remBase) removeBase(FileType.Unit, absPath);
	if (Object.keys(fileContent).length === 0 && configuration.modularization !== ModularizationType.None) {
		fs.unlinkSync(unitFilePath);
		return;
	}
	const unitStr = serialize({ DOTAUnits: fileContent });
	fs.writeFileSync(unitFilePath, unitStr);

	curAbilityNames.delete(unitName);
	updateTypes(FileType.Ability);
}

/**
 * Get the name and arguments of a decorator node.
 * @param decorator decorator node to check
 * @returns name and arguments (if any)
 */
function getDecoratorInfo(decorator: ts.Decorator): { name: string; args: ts.NodeArray<ts.Expression> } | undefined {
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
function getNodeName<T extends { name: ts.Node }>(node: T): string {
	const nameNode = node.name;
	if (!ts.isIdentifier(nameNode)) return "";
	return nameNode.escapedText ?? "";
}

/**
 * Get the expression name of a node.
 * @param node node to check
 * @returns expression name
 */
function getNodeExpressionName<T extends { expression: ts.Node }>(node: T): string {
	const nameNode = node.expression;
	if (!ts.isIdentifier(nameNode)) return "";
	return nameNode.escapedText ?? "";
}

/**
 * Return the content of an object node as an object.
 * @param node object node
 * @returns object
 */
function getObjectNodeEntries(node: ts.ObjectLiteralExpression): {
	[name: string]: string | string[] | object;
} {
	let entries: { [name: string]: any } = {};
	for (const property of node.properties) {
		if (!ts.isPropertyAssignment(property)) continue;
		const name = getNodeName(property);
		let value: string | string[] | object = "";
		if (ts.isNumericLiteral(property.initializer) || ts.isPrefixUnaryExpression(property.initializer)) {
			value = property.initializer.getText();
		} else if (ts.isStringLiteral(property.initializer)) {
			value = property.initializer.text;
		} else if (ts.isArrayLiteralExpression(property.initializer)) {
			value = [];
			for (const elem of property.initializer.elements) {
				if (ts.isNumericLiteral(elem) || ts.isPrefixUnaryExpression(elem)) {
					(value as string[]).push(elem.getText());
				} else if (ts.isStringLiteral(elem)) {
					(value as string[]).push(elem.text);
				} else if (ts.isIdentifier(elem)) {
					(value as string[]).push(elem.escapedText.toString());
				}
			}
		} else if (ts.isIdentifier(property.initializer)) {
			value = property.initializer.escapedText.toString();
		} else if (property.initializer.kind === ts.SyntaxKind.TrueKeyword) {
			value = "1";
		} else if (property.initializer.kind === ts.SyntaxKind.FalseKeyword) {
			value = "0";
		} else if (ts.isPropertyAccessExpression(property.initializer)) {
			const name = getNodeName(property.initializer);
			const expName = getNodeExpressionName(property.initializer);
			switch (expName) {
				case "LinkedSpecialBonusOperation":
					value = LinkedSpecialBonusOperationNames[name as keyof typeof LinkedSpecialBonusOperation];
					break;
				case "SpellImmunityTypes":
					value = SpellImmunityTypesNames[name as keyof typeof SpellImmunityTypes];
					break;
				case "SpellDispellableTypes":
					value = SpellDispellableTypesNames[name as keyof typeof SpellDispellableTypes];
					break;
				case "AbilityCastGestureSlotValue":
					value = AbilityCastGestureSlotValueNames[name as keyof typeof AbilityCastGestureSlotValue];
					break;
			}
		} else if (ts.isObjectLiteralExpression(property.initializer)) {
			const subEntries = getObjectNodeEntries(property.initializer);
			const obj: { [name: string]: string | object } = {};
			for (const [key, value] of Object.entries(subEntries)) {
				if (Array.isArray(value)) throw new TransformerError("Value array in invalid place!");
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
function getSpecialValues(node: ts.PropertyDeclaration): FinalAbilitySpecialValue[] {
	const initializer = node.initializer;
	if (!initializer) return [];
	if (!ts.isObjectLiteralExpression(initializer)) return [];
	const specials: FinalAbilitySpecialValue[] = [];
	for (const property of initializer.properties) {
		if (!ts.isPropertyAssignment(property)) continue;
		const name = getNodeName(property);
		if (
			ts.isNumericLiteral(property.initializer) ||
			ts.isStringLiteral(property.initializer) ||
			ts.isPrefixUnaryExpression(property.initializer)
		) {
			const value = property.initializer.getText();
			specials.push({
				type: isInt(value) ? AbilitySpecialValueType.INTEGER : AbilitySpecialValueType.FLOAT,
				name,
				value,
			});
		} else if (ts.isArrayLiteralExpression(property.initializer)) {
			const values: string[] = [];
			let type = AbilitySpecialValueType.INTEGER;
			for (const elem of property.initializer.elements) {
				if (ts.isNumericLiteral(elem) || ts.isStringLiteral(elem) || ts.isPrefixUnaryExpression(elem)) {
					values.push(elem.getText());
					if (!isInt(elem.getText())) type = AbilitySpecialValueType.FLOAT;
				}
			}
			specials.push({
				type,
				name,
				value: values,
			});
		} else if (ts.isObjectLiteralExpression(property.initializer)) {
			const entries = getObjectNodeEntries(property.initializer);
			let value: string | string[] = "";
			let type = AbilitySpecialValueType.INTEGER;
			if (entries["value"]) {
				if (Array.isArray(entries["value"])) {
					value = [];
					for (const elem of entries["value"]) {
						value.push(elem);
						if (!isInt(elem)) type = AbilitySpecialValueType.FLOAT;
					}
				} else if (typeof entries["value"] === "string") {
					value = entries["value"];
					if (!isInt(entries["value"])) type = AbilitySpecialValueType.FLOAT;
				}
			}
			const otherEntries: { [name: string]: string } = {};
			for (const [name, val] of Object.entries(entries)) {
				if (name === "value") continue;
				otherEntries[name] = val as string;
			}
			specials.push({
				type,
				name,
				value,
				...otherEntries,
			});
		}
	}
	return specials;
}

/**
 * Get the base properties of an ability.
 * @param node base property declaration node
 * @returns base properties
 */
function getAbilityBaseProperties(node: ts.PropertyDeclaration): FinalAbilityBaseProperties {
	const initializer = node.initializer;
	if (!initializer) return {};
	if (!ts.isObjectLiteralExpression(initializer)) return {};
	const properties: FinalAbilityBaseProperties = {};
	for (const [name, val] of Object.entries(getObjectNodeEntries(initializer))) {
		let value: string;
		if (Array.isArray(val)) {
			value = isNumberArr(val) ? val.join(" ") : val.join(" | ");
		} else if (typeof val === "string") {
			if (val in DifferentlyNamesEnums) {
				value = DifferentlyNamesEnums[val as keyof typeof DifferentlyNamesEnums];
			} else if (NumericBaseProperties.includes(name) && !isNumber(val)) {
				value = `%${val}`;
			} else {
				value = val;
			}
		} else {
			value = "";
		}
		properties[name as keyof AbilityBaseProperties] = value;
	}
	return properties;
}

/**
 * Get the base properties of an ability.
 * @param node base property declaration node
 * @returns base properties
 */
function getUnitBaseProperties(node: ts.PropertyDeclaration): FinalUnitBaseProperties {
	const initializer = node.initializer;
	const properties: FinalUnitBaseProperties = { BaseClass: "npc_dota_creature" };
	if (!initializer) return properties;
	if (!ts.isObjectLiteralExpression(initializer)) return properties;
	for (const [name, val] of Object.entries(getObjectNodeEntries(initializer))) {
		let value: string | object;
		if (Array.isArray(val)) {
			value = isNumberArr(val) ? val.join(" ") : val.join(" | ");
		} else if (typeof val === "string") {
			if (NumericBaseProperties.includes(name) && !isNumber(val)) {
				value = `%${val}`;
			} else {
				value = val;
			}
		} else {
			value = val;
		}
		properties[name as keyof UnitBaseProperties] = value;
	}
	return properties;
}

/**
 * Get the custom properties of an ability (user added).
 * @param node custom property declaration node
 * @returns custom properties
 */
function getCustomProperties(node: ts.PropertyDeclaration): CustomProperties {
	const initializer = node.initializer;
	if (!initializer) return {};
	if (!ts.isObjectLiteralExpression(initializer)) return {};
	const properties: { [key: string]: string } = {};
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
function getSkipValue(node: ts.PropertyDeclaration): boolean {
	const initializer = node.initializer;
	if (!initializer) return false;
	if (initializer.kind === ts.SyntaxKind.TrueKeyword) return true;
	return false;
}

function getUnitAbilities(node: ts.PropertyDeclaration): FinalUnitAbilities {
	const initializer = node.initializer;
	if (!initializer) return {};
	if (!ts.isArrayLiteralExpression(initializer)) return {};
	const abilities: FinalUnitAbilities = {};
	const abilityList: string[] = [];
	for (const entry of initializer.elements) {
		if (ts.isStringLiteral(entry)) {
			abilityList.push(entry.text);
		}
		if (ts.isObjectLiteralExpression(entry)) {
			const indexedEntry = getObjectNodeEntries(entry);
			const index = indexedEntry["index"] as string;
			abilities[index] = indexedEntry["name"] as string;
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
function checkNode(node: ts.Node) {
	if (ts.isClassDeclaration(node)) {
		const decorators = node.decorators;
		if (!decorators) return;
		if (!node.name) return;
		let decoratorType: DecoratorType | undefined;
		for (const deco of decorators) {
			const decoInfo = getDecoratorInfo(deco);
			if (!decoInfo) return;
			switch (decoInfo.name) {
				case DecoratorType.Ability:
					decoratorType = DecoratorType.Ability;
					break;
				case DecoratorType.Modifier:
					decoratorType = DecoratorType.Modifier;
					break;
				case DecoratorType.Hero:
					decoratorType = DecoratorType.Hero;
					break;
				case DecoratorType.Unit:
					decoratorType = DecoratorType.Unit;
					break;
				default:
					return;
			}
		}
		const name = node.name.escapedText.toString();
		if (!decoratorType) return;
		if (decoratorType === DecoratorType.Ability) {
			let values: FinalAbilitySpecialValue[] | undefined;
			let props: FinalAbilityBaseProperties | undefined;
			let customProps: CustomProperties | undefined;
			let skip = false;
			node.forEachChild((child) => {
				if (ts.isPropertyDeclaration(child)) {
					const name = getNodeName(child);
					if (name === ProtectedAbilityProperties.SpecialValues) {
						values = getSpecialValues(child);
					}
					if (name === ProtectedAbilityProperties.BaseProperties) {
						props = getAbilityBaseProperties(child);
					}
					if (name === ProtectedAbilityProperties.SkipAbility) {
						skip = getSkipValue(child);
					}
					if (name === ProtectedAbilityProperties.CustomProperties) {
						customProps = getCustomProperties(child);
					}
				}
			});
			const filePath = getCleanedFilePath(node);
			if (!skip) {
				const abilityList = curAbilities.get(filePath);
				if (!abilityList) return;

				if (!props) {
					if (configuration.strict === StrictType.Warn) {
						console.log(
							"\x1b[93m%s\x1b[0m",
							`[Ability Transformer] No properties for '${name}'. Skipping.`
						);
					}
					if (configuration.strict === StrictType.Error) {
						throw new TransformerError(`No properties for '${name}'. Aborting.`);
					}
					return;
				}

				abilityList.add({
					name,
					scriptFile: filePath,
					properties: props ?? {},
					specials: values ?? [],
					customProperties: customProps ?? {},
				});
			} else {
				debugPrint("Skipped ability creation for: " + name);
			}
		} else if (decoratorType === DecoratorType.Unit) {
			let abilities: FinalUnitAbilities | undefined;
			let props: FinalUnitBaseProperties | undefined;
			let customProps: CustomProperties | undefined;
			let skip = false;
			node.forEachChild((child) => {
				if (ts.isPropertyDeclaration(child)) {
					const name = getNodeName(child);
					if (name === ProtectedUnitProperties.Abilities) {
						abilities = getUnitAbilities(child);
					}
					if (name === ProtectedUnitProperties.BaseProperties) {
						props = getUnitBaseProperties(child);
					}
					if (name === ProtectedUnitProperties.SkipUnit) {
						skip = getSkipValue(child);
					}
					if (name === ProtectedUnitProperties.CustomProperties) {
						customProps = getCustomProperties(child);
					}
				}
			});
			const filePath = getCleanedFilePath(node);
			if (!skip) {
				const unitList = curUnits.get(filePath);
				if (!unitList) return;

				if (!props) {
					if (configuration.strict === StrictType.Warn) {
						console.log(
							"\x1b[93m%s\x1b[0m",
							`[Ability Transformer] No properties for '${name}'. Skipping.`
						);
					}
					if (configuration.strict === StrictType.Error) {
						throw new TransformerError(`No properties for '${name}'. Aborting.`);
					}
					return;
				}

				unitList.add({
					name,
					scriptFile: filePath,
					properties: props ?? {},
					abilities: abilities ?? {},
					customProperties: customProps ?? {},
				});
			} else {
				debugPrint("Skipped unit creation for: " + name);
			}
		}
	}
}

function hasNamedEntry(name: string, obj: Set<{ name: string }>): boolean {
	let found = false;
	obj.forEach((entryName) => {
		if (entryName.name === name) {
			found = true;
			return;
		}
	});
	return found;
}

function getFileCountByFolder(absPath: string, map: Map<string, Set<string>>) {
	const curModuleName = getModuleName(absPath);
	let count = 0;
	for (const [filePath, names] of map) {
		if (filePath === absPath) continue;
		const namesSet = names as Set<string>;
		if (namesSet.size === 0) continue;
		const moduleName = getModuleName(filePath);
		if (moduleName === curModuleName) count++;
	}
	return count;
}

function updateTypes(type: FileType) {
	const entries: string[] = [];
	let content = "";
	if (type === FileType.Ability) {
		curAbilityNames.forEach((name) => {
			entries.push(`${name} = "${name}"`);
		});
		content = BASE_TYPE[type].replace("$", entries.join(",\n\t") + ",");
	} else {
		curUnitNames.forEach((name) => {
			entries.push(`${name}: ${name}`);
		});
		const ignore = "//@ts-ignore\n\t";
		content = BASE_TYPE[type].replace("$", ignore + entries.join(`,\n\t${ignore}`) + ";");
	}

	try {
		fs.writeFileSync(GENERATED_TYPES_PATH[type], content);
	} catch {
		// Done
	}
}

/**
 * Check if this node should be deleted.
 * @param node node to check
 * @returns node. undefined if it has to be removed
 */
const removeNode: ts.Visitor = (node) => {
	if (ts.isPropertyDeclaration(node)) {
		const name = getNodeName(node);
		if (name in ProtectedAbilityProperties) return;
	}
	return node;
};

/**
 * Creates the transformer.
 */
const createDotaTransformer =
	(program: ts.Program): ts.TransformerFactory<ts.SourceFile> =>
	(context) => {
		const tsConfig = setTsConfig(program);
		const preEmitDiagnostics = [...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics()];
		if (tsConfig) {
			validateNettables(tsConfig.rootDir, tsConfig.output);
			// validateCustomGameevents(tsConfig.rootDir, tsConfig.output, program);
		}

		inititialize();
		const visit: ts.Visitor = (node) => {
			if (configuration.disable === true) return node;

			checkNode(node);
			if (!removeNode(node)) return;
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

			const fileName = getCleanedFilePath(file);

			let fileAbilities = abilityMap.get(fileName) ?? new Set();
			curAbilities.set(fileName, new Set());
			let fileUnits = unitMap.get(fileName) ?? new Set();
			curUnits.set(fileName, new Set());

			const res = ts.visitNode(file, visit);

			const curFileAbilities = curAbilities.get(fileName)!;
			fileAbilities.forEach((abilityName) => {
				if (!hasNamedEntry(abilityName, curFileAbilities)) {
					let remBase = false;
					if (configuration.modularization !== ModularizationType.None) {
						remBase = curFileAbilities.size === 0;
					}
					if (configuration.modularization === ModularizationType.Folder && remBase) {
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

			const curFileUnits = curUnits.get(fileName)!;
			fileUnits.forEach((unitName) => {
				if (!hasNamedEntry(unitName, curFileUnits)) {
					let remBase = false;
					if (configuration.modularization !== ModularizationType.None) {
						remBase = curFileUnits.size === 0;
					}
					if (configuration.modularization === ModularizationType.Folder && remBase) {
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

export default createDotaTransformer;
