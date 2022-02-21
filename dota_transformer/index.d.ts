/// <reference path="_generated/abilities.d.ts" />

interface CDOTA_Ability_Lua {
	/**
	 * Special Values for this ability.
	 *
	 * *Only use enums or literal values.*
	 */
	SpecialValues: AbilitySpecials;
	/**
	 * Define all KV values for your ability here.
	 *
	 * *Only use enums or literal values.*
	 */
	BaseProperties: AbilityBaseProperties;
	/**
	 * You can define additional custom KV properties for your ability here.
	 *
	 * *Only use enums or literal values.*
	 */
	CustomProperties: AbilityCustomProperties;
	/**
	 * Should this ability be skipped in the automated ability creation?
	 */
	SkipAbility: boolean;
}

interface AbilitySpecials {
	[name: string]: number | Array<number> | AbilitySpecialValueBlock;
}

interface AbilitySpecialValueBlock {
	value: number | Array<number>;
	LinkedSpecialBonus?: string;
	CalculateSpellDamageTooltip?: boolean;
	LinkedSpecialBonusField?: string;
	LinkedSpecialBonusOperation?: LinkedSpecialBonusOperation;
	RequiresScepter?: boolean;
}

declare const enum AbilitySpecialValueType {
	INTEGER = "FIELD_INTEGER",
	FLOAT = "FIELD_FLOAT",
}

interface AbilityCustomProperties {
	[key: string]: string | boolean | Array<number> | number;
}

interface AbilityBaseProperties {
	Type?: AbilityTypes;
	Behavior?: AbilityBehavior | Array<AbilityBehavior>;
	OnCastBar?: boolean;
	OnLearnBar?: boolean;
	FightRecapLevel?: 0 | 1 | 2;
	CastRange?: Array<number> | number | string;
	CastRangeBuffer?: Array<number> | number | string;
	CastPoint?: Array<number> | number | string;
	ChannelTime?: Array<number> | number | string;
	Cooldown?: Array<number> | number | string;
	Duration?: Array<number> | number | string;
	SharedCooldown?: string;
	Damage?: Array<number> | number | string;
	ManaCost?: Array<number> | number | string;
	ModifierSupportValue?: number;
	ModifierSupportBonus?: number;
	UnitTargetTeam?: UnitTargetTeam | Array<UnitTargetTeam>;
	CastAnimation?: GameActivity;
	MaxLevel?: number;
	UnitDamageType?: DamageTypes;
	SpellImmunityType?: SpellImmunityTypes;
	Sound?: string;
	HasScepterUpgrade?: boolean;
	SpellDispellableType?: SpellDispellableTypes;
	HasShardUpgrade?: boolean;
	CastGestureSlot?: AbilityCastGestureSlotValue;
	UnitTargetType?: UnitTargetType | Array<UnitTargetType>;
	AbilityDraftUltScepterAbility?: string;
	GrantedByScepter?: boolean;
	UnitTargetFlags?: UnitTargetFlags | Array<UnitTargetFlags>;
	GrantedByShard?: boolean;
	AbilityDraftUltShardAbility?: string;
	Charges?: Array<number> | number | string;
	ChargeRestoreTime?: Array<number> | number | string;
	LinkedAbility?: string;
	AbilityDraftPreAbility?: string;
	ChannelAnimation?: GameActivity;
	IsShardUpgrade?: boolean;
	RequiredLevel?: number;
	LevelsBetweenUpgrades?: number;
	HotKeyOverride?: string;
	DisplayAdditionalHeroes?: boolean;
	TextureName?: string;
	// Precache?: Array<PrecacheKV>;
	AnimationPlaybackRate?: Array<number> | number | string;
	AbilityDraftUltScepterPreAbility?: string;
	Modelscale?: number;
	AssociatedConsumable?: number;
	UnlockMinEffectIndex?: number;
	UnlockMaxEffectIndex?: number;
	EventID?: number;
	ScriptFile?: string;
	AnimationIgnoresModelScale?: boolean;
	IsCastableWhileHidden?: boolean;
}

declare enum SpellImmunityTypes {
	ENEMIES_YES = "SPELL_IMMUNITY_ENEMIES_YES",
	ENEMIES_NO = "SPELL_IMMUNITY_ENEMIES_NO",
	ALLIES_NO = "SPELL_IMMUNITY_ALLIES_NO",
	ALLIES_YES = "SPELL_IMMUNITY_ALLIES_YES",
	ALLIES_YES_ENEMIES_NO = "SPELL_IMMUNITY_ALLIES_YES_ENEMIES_NO",
}

declare enum SpellDispellableTypes {
	DISPELLABLE_YES = "SPELL_DISPELLABLE_YES",
	DISPELLABLE_NO = "SPELL_DISPELLABLE_NO",
	DISPELLABLE_YES_STRONG = "SPELL_DISPELLABLE_YES_STRONG",
}

declare enum AbilityCastGestureSlotValue {
	DEFAULT = "DEFAULT",
	ABSOLUTE = "ABSOLUTE",
}

declare enum LinkedSpecialBonusOperation {
	SUBTRACT = "SPECIAL_BONUS_SUBTRACT",
	PERCENTAGE_ADD = "SPECIAL_BONUS_PERCENTAGE_ADD",
	MULTIPLY = "SPECIAL_BONUS_MULTIPLY",
}

type Short = number & {
	readonly __tag__: "Short";
};
type Long = number & {
	readonly __tag__: "Long";
};
type Float = number & {
	readonly __tag__: "Float";
};
