import * as ts from "typescript";
import { validateCustomGameevents } from "dota_transformer_pkg/checkDeclarations";
import { setTsConfig, getConfiguration, configuration } from "dota_transformer_pkg/transform";

let initialized = false;
/**
 * Check what abilities are currently defined already.
 */
function inititialize() {
	if (initialized === true) return;
	initialized = true;

	getConfiguration();
}

/**
 * Creates the transformer.
 */
const createDotaTransformer =
	(program: ts.Program): ts.TransformerFactory<ts.SourceFile> =>
	(context) => {
		const tsConfig = setTsConfig(program);
		if (tsConfig) {
			validateCustomGameevents(tsConfig.rootDir, tsConfig.output, program);
		}

		inititialize();
		const visit: ts.Visitor = (node) => {
			if (configuration.disable === true) return node;

			return ts.visitEachChild(node, visit, context);
		};
		return (file) => {
			const res = ts.visitNode(file, visit);
			return res;
		};
	};

export default createDotaTransformer;
