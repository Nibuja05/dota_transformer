import { KVObject, serialize, deserializeFile, KVValue, isKvObject } from "valve-kv";
import * as path from "path";
import * as fs from "fs";

function load(): KVObject {
	const filePath = path.join(__dirname, "npc_units.txt");
	const obj = deserializeFile(filePath);
	return obj["DOTAUnits"] as KVObject;
}

function write(classes: Set<string>) {
	let content = "declare const enum UnitBaseClasses {\n";
	classes.forEach((name) => {
		let shortName = name.replace("npc_dota_", "");
		shortName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
		content += `\t${shortName} = "${name}",\n`;
	});
	content += "}";
	const filePath = path.join(__dirname, "output.txt");
	fs.writeFileSync(filePath, content, "utf-8");
}

const obj = load();
const baseClasses: Set<string> = new Set();

for (const [name, unitKV] of Object.entries(obj)) {
	if (isKvObject(unitKV)) {
		if ("BaseClass" in unitKV) {
			baseClasses.add(unitKV["BaseClass"] as string);
		}
	}
}

write(baseClasses);
