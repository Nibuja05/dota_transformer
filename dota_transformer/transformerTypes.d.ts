interface FinalAbilitySpecialValue extends AbilitySpecialValueBlock {
	name: string;
	type: AbilitySpecialValueType;
	value: string | Array<string>;
}

type FinalAbilityBaseProperties = {
	[K in keyof AbilityBaseProperties]: string;
};

type FinalUnitBaseProperties = {
	[K in keyof UnitBaseProperties]: string | object;
};

type FinalUnitAbilities = {
	[index: string]: string;
};

interface KVAbility {
	[name: string]: {
		[key: string]: string | object;
		AbilitySpecial: {
			[index: string]: AbilitySpecialBlock;
		};
	};
}

interface AbilitySpecialBlock {
	[name: string]: string;
	var_type: AbilitySpecialValueType;
	LinkedSpecialBonus?: string;
	CalculateSpellDamageTooltip?: boolean;
	LinkedSpecialBonusField?: string;
	LinkedSpecialBonusOperation?: LinkedSpecialBonusOperation;
	RequiresScepter?: boolean;
}

interface AbilityInformation {
	name: string;
	scriptFile: string;
	properties: FinalAbilityBaseProperties;
	specials: FinalAbilitySpecialValue[];
	customProperties: AbilityCustomProperties;
}

interface UnitInformation {
	name: string;
	scriptFile: string;
	properties: FinalUnitBaseProperties;
	abilities: FinalUnitAbilities;
	customProperties: AbilityCustomProperties;
}

const enum ModularizationType {
	Folder = "folder",
	File = "file",
	None = "none",
}

const enum StrictType {
	Off = "off",
	Warn = "warn",
	Error = "error",
}

interface ConfigurationFile {
	modularization: ModularizationType;
	debug: boolean;
	strict: StrictType;
	disable: boolean;
}

interface TSConfiguration {
	output: string;
	rootDir: string;
}

interface TSConfigurationFile {
	compilerOptions: {
		rootDir?: string;
		outDir?: string;
	};
}

declare const enum DecoratorType {
	Ability = "registerAbility",
	Modifier = "registerModifier",
	Unit = "registerUnit",
	Hero = "registerHero",
}

declare const enum FileType {
	Ability = "Ability",
	Unit = "Unit",
}
