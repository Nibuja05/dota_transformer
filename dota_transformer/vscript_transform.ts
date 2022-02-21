import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
const node_modules = require("node_modules-path");
import { KVObject, serialize, deserializeFile, KVValue } from "valve-kv";
import {
	DifferentlyNamedAbilityKVs,
	DifferentlyNamesEnums,
	NumericBaseProperties,
	LinkedSpecialBonusOperationNames,
	SpellImmunityTypesNames,
	SpellDispellableTypesNames,
	AbilityCastGestureSlotValueNames,
	ProtectedProperties,
} from "dota_transformer/transformEnums";
import { validateNettables } from "dota_transformer/checkDeclarations";
import {
	getTsConfig,
	setTsConfig,
	getConfiguration,
	AbilityTransformerError,
	debugPrint,
	configuration,
	isInt,
	isNumber,
	isNumberArr,
} from "dota_transformer/transform";

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

const abilityMap: Map<string, Set<string>> = new Map();
const curAbilities: Map<string, Set<AbilityInformation>> = new Map();
const curAbilityNames: Set<string> = new Set();
let curError = false;

/**
 * Get the path to the ability directory inside "scripts/npc"
 * @returns ability path
 */
function getAbilityPath(): string {
	const vPath = getTsConfig().output;
	const abilityDir = path.resolve(vPath, "../npc");
	if (!fs.existsSync(abilityDir)) throw new AbilityTransformerError("NPC script path not found");
	const genPath = abilityDir + "/abilities";
	if (!fs.existsSync(genPath)) fs.mkdirSync(genPath);
	return genPath;
}

/**
 * Get the file path of an ability based on the current node.
 * @param node current node
 * @returns current node file path (relative from "vscripts")
 */
function getCleanedFilePath(node: ts.Node): string {
	const rootPath = getTsConfig().rootDir;
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
function getAllGeneratedAbilities(): KVObject | undefined {
	const abilityPath = getAbilityPath();
	const abilityFilePath = abilityPath + GENERATED_FILE_NAME;
	if (!fs.existsSync(abilityFilePath)) {
		debugPrint("Failed to find " + GENERATED_FILE_NAME);
		return;
	}
	return deserializeFile(abilityFilePath);
}

/**
 * Get all currently generated abilities.
 * @returns generated abilities object
 */
function getGeneratedAbilities(absPath: string): KVObject | undefined {
	const abilityFilePath = getAbilityPathName(absPath);
	if (!fs.existsSync(abilityFilePath)) {
		debugPrint("Failed to find " + abilityFilePath);
		return;
	}
	return deserializeFile(abilityFilePath);
}

/**
 * Writes the information of this ability object to a file, based on current configuration.
 * @param absPath orig file path (to determine modularization)
 * @param abilityObject ability object to write
 */
function writeGeneratedAbilities(absPath: string, abilityObject: KVObject) {
	const abilityStr = serialize({ DOTAAbilities: abilityObject });
	const abilityFilePath = getAbilityPathName(absPath);
	debugPrint("Write to " + abilityFilePath);
	fs.writeFileSync(abilityFilePath, abilityStr);
	addBase(absPath);
}

/**
 * Writes the information of this ability object to a file.
 * Never uses modularization.
 * @param abilityObject
 */
function writeAllGeneratedAbilities(abilityObject: KVObject) {
	const abilityStr = serialize({ DOTAAbilities: abilityObject });
	const abilityPath = getAbilityPath() + GENERATED_FILE_NAME;
	debugPrint("Write all abilities");
	fs.writeFileSync(abilityPath, abilityStr);
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
function getAbilityPathName(absPath: string): string {
	const abilityPath = getAbilityPath();
	let abilityFilePath: string;
	switch (configuration.modularization) {
		case ModularizationType.None:
			abilityFilePath = abilityPath + GENERATED_FILE_NAME;
			break;
		case ModularizationType.File:
		case ModularizationType.Folder:
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
function addBase(absPath: string) {
	debugPrint("Check bases [Add]");
	if (configuration.modularization === ModularizationType.None) return;
	const moduleName = getModuleName(absPath);
	const curBases = getBases();
	if (curBases.includes(moduleName)) {
		debugPrint("Base " + moduleName + " already included");
		return;
	}
	writeBases([...curBases, moduleName]);
}

/**
 * Remove a base from the generatedAbilities.kv file.
 * Checks if the base actually exists.
 * @param absPath abs path of the ability
 */
function removeBase(absPath: string) {
	debugPrint("Check bases [Remove]");
	if (configuration.modularization === ModularizationType.None) return;
	const moduleName = getModuleName(absPath);
	const curBases = getBases();
	if (!curBases.includes(moduleName)) {
		debugPrint("Base " + moduleName + " not included");
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
	debugPrint("Check if " + GENERATED_FILE_NAME + " is already included as base");
	if (!fs.existsSync(baseAbilityFilePath)) {
		fs.writeFileSync(baseAbilityFilePath, BASE_NPC_ABILITY_FILE);
	} else {
		const baseAbilityFile = fs.readFileSync(baseAbilityFilePath).toString();
		const regex = /^#base\s+["'](.*)["']/gm;
		let match: RegExpExecArray | null;
		const includedFiles: string[] = [];
		while ((match = regex.exec(baseAbilityFile)) !== null) {
			if (!match) continue;
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
	if (initialized === true) return;
	initialized = true;

	getConfiguration();
	if (configuration.disable === true) return;

	console.log("[Ability Transformer] Initialize...");

	checkAbilityBase();

	let origfileContent: KVObject | undefined;
	try {
		origfileContent = getAllGeneratedAbilities();
	} catch {
		debugPrint("Failed to read " + GENERATED_FILE_NAME);
	}
	let fileContent: KVObject = {};
	if (!origfileContent || Object.keys(origfileContent).length === 0) {
		debugPrint(GENERATED_FILE_NAME + " is empty or not found");
		const abilityPath = `${getAbilityPath()}${GENERATED_FILE_NAME}`;
		fs.writeFileSync(abilityPath, BASE_ABILITY_OBJECT);

		if (configuration.modularization !== ModularizationType.None) {
			const abilityBasePath = `${getAbilityPath()}/${GENERATED_FILE_PATH}`;
			if (!fs.existsSync(abilityBasePath)) fs.mkdirSync(abilityBasePath);
		}

		console.log("\x1b[32m%s\x1b[0m", "[Ability Transformer] Initialization complete!\n");
		return;
	} else {
		fileContent = origfileContent.DOTAAbilities as KVObject;
	}
	for (const [key, value] of Object.entries(fileContent)) {
		const fileName = (value as KVObject)["ScriptFile"] as string | undefined;
		if (!fileName) continue;
		let abilitySet = abilityMap.get(fileName);
		if (!abilitySet) abilitySet = new Set();
		abilitySet.add(key);
		abilityMap.set(fileName, abilitySet);
	}
	const bases = getBases();

	// Adjust the bases to the current configuration
	switch (configuration.modularization) {
		case ModularizationType.None: {
			debugPrint("Switch to modularization: " + configuration.modularization);
			if (bases.length > 0) {
				writeAllGeneratedAbilities(fileContent);
			}
			const abilityBasePath = `${getAbilityPath()}/${GENERATED_FILE_PATH}`;
			if (fs.existsSync(abilityBasePath)) {
				fs.rmdirSync(abilityBasePath, { recursive: true });
			}
			break;
		}
		case ModularizationType.File:
		case ModularizationType.Folder:
			debugPrint("Switch to modularization: " + configuration.modularization);
			const abilityBasePath = `${getAbilityPath()}/${GENERATED_FILE_PATH}`;
			if (!fs.existsSync(abilityBasePath)) {
				fs.mkdirSync(abilityBasePath);
			} else {
				fs.rmdirSync(abilityBasePath, { recursive: true });
				fs.mkdirSync(abilityBasePath);
			}

			const moduleMap: Map<string, KVObject> = new Map();
			for (const [key, value] of Object.entries(fileContent)) {
				const fileName = (value as KVObject)["ScriptFile"] as string | undefined;
				if (!fileName) continue;
				const moduleName = getModuleName(fileName);
				const curModules = moduleMap.get(moduleName) ?? ({} as KVObject);
				curModules[key] = value;
				moduleMap.set(moduleName, curModules);
			}

			debugPrint("Write new modularized ability files...");
			const newBases: string[] = [];
			moduleMap.forEach((value, key) => {
				newBases.push(key);
				const abilityStr = serialize({ DOTAAbilities: value });
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
function getBases(): string[] {
	debugPrint("Get current bases");
	const abilityPath = getAbilityPath();
	const abilityFilePath = abilityPath + GENERATED_FILE_NAME;
	if (!fs.existsSync(abilityFilePath)) return [];
	const content = fs.readFileSync(abilityFilePath, "utf-8");
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
function writeBases(bases: string[]) {
	let basesString = "";
	for (const base of bases) {
		basesString += `#base "${GENERATED_FILE_PATH}/${base}.kv"\n`;
	}
	basesString += BASE_ABILITY_OBJECT;
	const abilityPath = `${getAbilityPath()}${GENERATED_FILE_NAME}`;
	debugPrint("Refresh bases");
	fs.writeFileSync(abilityPath, basesString);
}

/**
 * Create the ability text from the given information and update the ability kvs.
 * @param name name of the ability
 * @param scriptFile scripts file path
 * @param properties base properties of the the ability
 * @param specials ability special values
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
	const origfileContent = getGeneratedAbilities(ability.scriptFile);
	let fileContent: KVObject = {};
	if (origfileContent) {
		fileContent = origfileContent.DOTAAbilities as KVObject;
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
function removeAbility(absPath: string, abilityName: string, remBase: boolean) {
	debugPrint("Remove ability: " + abilityName);
	const origfileContent = getGeneratedAbilities(absPath);
	const abilityFilePath = getAbilityPathName(absPath);
	let fileContent: KVObject = {};
	if (origfileContent) {
		fileContent = origfileContent.DOTAAbilities as KVObject;
	}
	delete fileContent[abilityName];
	if (remBase) removeBase(absPath);
	if (Object.keys(fileContent).length === 0 && configuration.modularization !== ModularizationType.None) {
		fs.unlinkSync(abilityFilePath);
		return;
	}
	const abilityStr = serialize({ DOTAAbilities: fileContent });
	fs.writeFileSync(abilityFilePath, abilityStr);

	curAbilityNames.delete(abilityName);
	updateAbilityTypes();
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
	[name: string]: string | string[];
} {
	let entries: { [name: string]: any } = {};
	for (const property of node.properties) {
		if (!ts.isPropertyAssignment(property)) continue;
		const name = getNodeName(property);
		let value: string | string[] = "";
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
				} else {
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
function getBaseProperties(node: ts.PropertyDeclaration): FinalAbilityBaseProperties {
	const initializer = node.initializer;
	if (!initializer) return {};
	if (!ts.isObjectLiteralExpression(initializer)) return {};
	const properties: FinalAbilityBaseProperties = {};
	for (const [name, val] of Object.entries(getObjectNodeEntries(initializer))) {
		let value: string;
		if (Array.isArray(val)) {
			value = isNumberArr(val) ? val.join(" ") : val.join(" | ");
		} else {
			if (val in DifferentlyNamesEnums) {
				value = DifferentlyNamesEnums[val as keyof typeof DifferentlyNamesEnums];
			} else if (NumericBaseProperties.includes(name) && !isNumber(val)) {
				value = `%${val}`;
			} else {
				value = val;
			}
		}
		properties[name as keyof AbilityBaseProperties] = value;
	}
	return properties;
}

/**
 * Get the custom properties of an ability (user added).
 * @param node custom property declaration node
 * @returns custom properties
 */
function getCustomProperties(node: ts.PropertyDeclaration): AbilityCustomProperties {
	const initializer = node.initializer;
	if (!initializer) return {};
	if (!ts.isObjectLiteralExpression(initializer)) return {};
	const properties: { [key: string]: string } = {};
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
function getSkipValue(node: ts.PropertyDeclaration): boolean {
	const initializer = node.initializer;
	if (!initializer) return false;
	if (initializer.kind === ts.SyntaxKind.TrueKeyword) return true;
	return false;
}

/**
 * Check if a node is an ability class and write it.
 * @param node node to check
 */
function checkNode(node: ts.Node) {
	if (ts.isClassDeclaration(node)) {
		const decorators = node.decorators;
		if (!decorators) return;
		for (const deco of decorators) {
			const decoInfo = getDecoratorInfo(deco);
			if (!decoInfo) return;
			if (decoInfo.name !== "registerAbility") return;
		}
		if (!node.name) return;
		const name = node.name.escapedText.toString();
		let values: FinalAbilitySpecialValue[] | undefined;
		let props: FinalAbilityBaseProperties | undefined;
		let customProps: AbilityCustomProperties | undefined;
		let skip = false;
		node.forEachChild((child) => {
			if (ts.isPropertyDeclaration(child)) {
				const name = getNodeName(child);
				if (name === ProtectedProperties.SpecialValues) {
					values = getSpecialValues(child);
				}
				if (name === ProtectedProperties.BaseProperties) {
					props = getBaseProperties(child);
				}
				if (name === ProtectedProperties.SkipAbility) {
					skip = getSkipValue(child);
				}
				if (name === ProtectedProperties.CustomProperties) {
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
					console.log("\x1b[93m%s\x1b[0m", `[Ability Transformer] No properties for '${name}'. Skipping.`);
				}
				if (configuration.strict === StrictType.Error) {
					throw new AbilityTransformerError(`No properties for '${name}'. Aborting.`);
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
	}
}

function hasAbility(abilityName: string, abilities: Set<AbilityInformation>): boolean {
	let found = false;
	abilities.forEach((ability) => {
		if (ability.name === abilityName) {
			found = true;
			return;
		}
	});
	return found;
}

function getAbilityFileCountByFolder(absPath: string) {
	const curModuleName = getModuleName(absPath);
	let count = 0;
	for (const [filePath, names] of abilityMap) {
		if (filePath === absPath) continue;
		const namesSet = names as Set<string>;
		if (namesSet.size === 0) continue;
		const moduleName = getModuleName(filePath);
		if (moduleName === curModuleName) count++;
	}
	return count;
}

function updateAbilityTypes() {
	// console.log("UPDATE!!");
	const entries: string[] = [];
	curAbilityNames.forEach((name) => {
		entries.push(`${name} = "${name}"`);
	});
	const content = BASE_ABILITY_TYPE.replace("$", entries.join(",\n\t"));
	try {
		fs.writeFileSync(GENERATED_TYPES_PATH_ABILITIES, content);
	} catch {
		// Done
		console.log(path.resolve(GENERATED_TYPES_PATH_ABILITIES));
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
		if (name in ProtectedProperties) return;
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

			let fileAbilities = abilityMap.get(fileName) ?? new Set();
			curAbilities.set(fileName, new Set());

			const res = ts.visitNode(file, visit);

			const curFileAbilities = curAbilities.get(fileName)!;
			fileAbilities.forEach((abilityName) => {
				if (!hasAbility(abilityName, curFileAbilities)) {
					let remBase = false;
					if (configuration.modularization !== ModularizationType.None) {
						remBase = curFileAbilities.size === 0;
					}
					if (configuration.modularization === ModularizationType.Folder && remBase) {
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

export default createDotaTransformer;
