import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

// initially set to the default config
export let configuration: ConfigurationFile = {
	modularization: ModularizationType.Folder,
	debug: false,
	strict: StrictType.Warn,
	disable: false,
};

/**
 * Is the given number in the string an integer or a float?
 * Negative values as handled as float, since dota tooltips work this way...
 * @param num number string to check
 * @returns true, if its an integer
 */
export function isInt(num: string): boolean {
	const parsedNum = parseFloat(num);
	if (parsedNum < 0) return false;
	return Number.isInteger(parsedNum);
}

/**
 * Check if the given input is a valid number.
 * @param val number or string represented number
 * @returns true, if its a valid number
 */
export function isNumber(val: number | string) {
	if (typeof val === "number") return true;
	const num = parseFloat(val);
	if (!num) return false;
	if (isNaN(num)) return false;
	return isFinite(num);
}

/**
 * Check if the given input is an array of valid numbers.
 * Its assumed that all elements are the same type.
 * @param arr input array
 * @returns true, if its a number array
 */
export function isNumberArr(arr: string[]): boolean {
	if (arr.length < 1) return false;
	return isNumber(arr[0]);
}

/**
 * Print debug messages
 * @param msg message to print
 */
export function debugPrint(msg: string) {
	if (configuration.debug) console.log("> " + msg);
}

/**
 * Custom error for this transfomer.
 */
export class TransformerError {
	constructor(message: string) {
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

/**
 * Read the current configuration file or create a new one if none exists.
 */
export function getConfiguration() {
	const filePath = ".abilityTransformerrc.json";
	if (!fs.existsSync(filePath)) {
		return;
	} else {
		const content = fs.readFileSync(filePath, "utf-8");
		const newConfig: ConfigurationFile = JSON.parse(content);
		for (const [key, val] of Object.entries(newConfig)) {
			(configuration[key as keyof ConfigurationFile] as any) = val;
		}
	}
	debugPrint("Get current configuration");
}

let curTSConfig: TSConfiguration | undefined;
/**
 * Get the current tsconfig paths
 * @returns
 */
export function getTsConfig(): TSConfiguration {
	if (!curTSConfig) throw new TransformerError("TS configuration not found!");
	return curTSConfig;
}

/**
 * Read the current tsconfig file and load its paths
 * @param program
 * @returns
 */
export function setTsConfig(program: ts.Program) {
	if (curTSConfig) return curTSConfig;
	const configFilePath = (program.getCompilerOptions() as { configFilePath: string }).configFilePath;
	const match = configFilePath.match(/(.*)[\/\\]tsconfig\.json/);
	if (!match) throw new TransformerError("No valid path for tsconfig file: ");
	const configFileDir = match[1];

	const configFileRaw = fs.readFileSync(configFilePath, "utf-8");
	const configFile: TSConfigurationFile = JSON.parse(configFileRaw);
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
