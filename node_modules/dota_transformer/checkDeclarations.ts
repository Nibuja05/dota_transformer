import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import { KVObject, serialize, deserializeFile, KVValue, isKvObject } from "valve-kv";
import { AbilityTransformerError } from "dota_transformer/transform";

const BASE_NETTABLE_CONTENT = `<!-- kv3 encoding:text:version{e21c7f3c-8a33-41c5-9977-a76d3a32aa0d} format:generic:version{7412167c-06e9-4698-aff2-e63eb59037e7} -->
{
	custom_net_tables =
	[
		"$"
	]
}`;

function compareArrays<T>(arr1: T[], arr2: T[]): boolean {
	if (arr1.length !== arr2.length) return false;
	for (const elem1 of arr1) {
		if (!arr2.includes(elem1)) return false;
	}
	return true;
}

type ValidationType = "Nettables" | "Gameevents";

let vTimeout_Nettables: NodeJS.Timeout | undefined;
let vTimeout_Gameevents: NodeJS.Timeout | undefined;
function tryValidate(type: ValidationType, success: () => void) {
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

function getAllDeclarationFiles(basePath: string): string[] {
	let declarationFiles: string[] = [];
	const dirContent = fs.readdirSync(basePath);
	for (const contentPath of dirContent) {
		const newPath = path.join(basePath, contentPath);
		if (fs.lstatSync(newPath).isDirectory()) {
			declarationFiles = declarationFiles.concat(getAllDeclarationFiles(newPath));
		} else {
			if (contentPath.includes(".d.ts")) {
				declarationFiles.push(newPath);
			}
		}
	}
	return declarationFiles;
}

function getNettableFields(node: ts.Node) {
	const nettables: string[] = [];
	const checkNodes = (node: ts.Node) => {
		if (ts.isInterfaceDeclaration(node)) {
			if (node.name.text === "CustomNetTableDeclarations") {
				for (const member of node.members) {
					if (member.name) {
						nettables.push((member.name as ts.Identifier).escapedText.toString());
					}
				}
			}
		}
		ts.forEachChild(node, checkNodes);
	};
	checkNodes(node);
	return nettables;
}

function getAllNettables(files: string[]) {
	let allNettables: string[] = [];
	for (const file of files) {
		const content = fs.readFileSync(file, "utf-8");
		const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.ES2016);
		const nettables = getNettableFields(sourceFile);
		allNettables = allNettables.concat(nettables);
	}
	return allNettables;
}

function checkCurrentNettableFile(scriptPath: string, entries: string[]) {
	const nettableFilePath = path.join(scriptPath, "custom_net_tables.txt");
	if (entries.length < 1) return;
	if (fs.existsSync(nettableFilePath)) {
		const curContent = fs.readFileSync(nettableFilePath, "utf-8");
		const regex = /\"(\w+)\"/g;
		let match;
		const curEntries: string[] = [];
		while ((match = regex.exec(curContent)) !== null) {
			curEntries.push(match[1]);
		}
		if (!compareArrays(entries, curEntries)) {
			const content = BASE_NETTABLE_CONTENT.replace("$", entries.join(`",\n\t\t"`));
			fs.writeFileSync(nettableFilePath, content, "utf-8");
		}
	} else {
		const content = BASE_NETTABLE_CONTENT.replace("$", entries.join(`",\n\t\t"`));
		fs.writeFileSync(nettableFilePath, content, "utf-8");
	}
}

export function validateNettables(rootDir: string, outDir: string) {
	tryValidate("Nettables", () => {
		console.log("Validate nettables!");
		const files = getAllDeclarationFiles(path.resolve(rootDir, "../"));
		const nettables = getAllNettables(files);
		checkCurrentNettableFile(path.resolve(outDir, "../"), nettables);
	});
}

function getMemberTypes(member: ts.TypeElement, typeChecker: ts.TypeChecker): { [name: string]: string } {
	//@ts-ignore
	const type = typeChecker.getTypeAtLocation(member.type);
	if (!type.symbol) return {};
	if (!type.symbol.declarations) return {};
	const declaration = type.symbol.declarations[0];
	if (ts.isInterfaceDeclaration(declaration)) {
		let memberTypes: { [name: string]: string } = {};
		declaration.members.forEach((value, key) => {
			if (!value.name) return;
			const name = (value.name as ts.Identifier).escapedText.toString();
			const newType = getElementType(value, typeChecker);
			if (newType) {
				memberTypes[name] = newType;
			}
		});
		return memberTypes;
	}

	return {};
}

function getElementType(element: ts.TypeElement, typeChecker: ts.TypeChecker): string | undefined {
	//@ts-ignore
	const type = typeChecker.getTypeAtLocation(element.type);
	return getTypeString(type, typeChecker);
}

function getTypeString(type: ts.Type, typeChecker: ts.TypeChecker): string | undefined {
	const stringType = typeChecker.typeToString(type);
	if (["string", "number", "boolean", "Short", "Long", "Float"].includes(stringType)) return stringType;

	if (!type.symbol) {
		if (type.isUnionOrIntersection()) {
			let stringTypes: string = "";
			type.types.forEach((value, _) => {
				const newType = getTypeString(value, typeChecker);
				if (!newType) return;
				if (stringTypes === "") stringTypes = newType;
			});
			return stringTypes;
		}
		if (type.isLiteral()) {
			if (type.isStringLiteral()) return "string";
			if (type.isNumberLiteral()) return "number";
			return;
		}

		return;
	}
	if (type.symbol.declarations) {
		const declaration = type.symbol.declarations[0];
		if (ts.isEnumMember(declaration)) {
			if (!declaration.initializer) return;
			if (ts.isNumericLiteral(declaration.initializer)) return "Short";
			if (ts.isStringLiteral(declaration.initializer)) return "string";
		}
	}

	return;
}

interface GameEvents {
	[eventName: string]: { [propertyName: string]: string };
}

function getGameeventFields(node: ts.Node, program: ts.Program) {
	const gameevents: GameEvents = {};
	const typeChecker = program.getTypeChecker();
	const checkNodes = (node: ts.Node) => {
		if (ts.isInterfaceDeclaration(node)) {
			if (node.name.text === "GameEventDeclarations") {
				for (const member of node.members) {
					if (member.name) {
						const eventName = (member.name as ts.Identifier).escapedText.toString();
						const types = getMemberTypes(member, typeChecker);
						let transformedTypes: { [name: string]: string } = {};
						for (const [tName, tVal] of Object.entries(types)) {
							let newVal: string;
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

function getAllGameevents(files: string[], program: ts.Program) {
	let allGameevents: GameEvents = {};
	for (const file of files) {
		// const content = fs.readFileSync(file, "utf-8");
		// console.log("TRY", file);
		// console.log(program.getSourceFile(file)?.isDeclarationFile);
		const sourceFile = program.getSourceFile(file);
		if (!sourceFile) continue;
		const gameevents = getGameeventFields(sourceFile, program);
		allGameevents = { ...allGameevents, ...gameevents };
	}
	return allGameevents;
}

function checkCurrentGameeventsFile(scriptPath: string, events: GameEvents) {
	const gameeventsFilePath = path.join(scriptPath, "custom.gameevents");
	const eventsObjects: KVObject = {
		CustomEvents: events,
	};
	const content = serialize(eventsObjects);
	fs.writeFileSync(gameeventsFilePath, content, "utf8");
}

function findScriptPath(): string {
	if (!fs.existsSync("game")) throw new AbilityTransformerError(`"game" path not found`);
	const scriptPath = path.join("game", "scripts");
	if (!fs.existsSync(scriptPath)) throw new AbilityTransformerError(`"${scriptPath}" path not found`);
	return scriptPath;
}

export function validateCustomGameevents(rootDir: string, outDir: string, program: ts.Program) {
	tryValidate("Gameevents", () => {
		console.log("Validate gameevents!");
		const files = getAllDeclarationFiles(path.resolve(rootDir, "../"));
		const events = getAllGameevents(files, program);
		checkCurrentGameeventsFile(findScriptPath(), events);
	});
}

// validateNettables("src/vscripts", "game/scripts/vscripts");
// validateCustomGameevents("src/vscripts", "game/scripts/vscripts");
