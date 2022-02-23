/// <reference path="_generated/abilities.d.ts" />
/// <reference path="_generated/units.d.ts" />

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
	CustomProperties: CustomProperties;
	/**
	 * Should this ability be skipped in the automated ability creation?
	 */
	SkipAbility: boolean;
	/**
	 * Stuff to precache.
	 */
	PrecacheKV: PrecacheBlock;
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

interface CustomProperties {
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

declare const enum SpellImmunityTypes {
	ENEMIES_YES = "SPELL_IMMUNITY_ENEMIES_YES",
	ENEMIES_NO = "SPELL_IMMUNITY_ENEMIES_NO",
	ALLIES_NO = "SPELL_IMMUNITY_ALLIES_NO",
	ALLIES_YES = "SPELL_IMMUNITY_ALLIES_YES",
	ALLIES_YES_ENEMIES_NO = "SPELL_IMMUNITY_ALLIES_YES_ENEMIES_NO",
}

declare const enum SpellDispellableTypes {
	DISPELLABLE_YES = "SPELL_DISPELLABLE_YES",
	DISPELLABLE_NO = "SPELL_DISPELLABLE_NO",
	DISPELLABLE_YES_STRONG = "SPELL_DISPELLABLE_YES_STRONG",
}

declare const enum AbilityCastGestureSlotValue {
	DEFAULT = "DEFAULT",
	ABSOLUTE = "ABSOLUTE",
}

declare const enum LinkedSpecialBonusOperation {
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

interface PrecacheBlock {}

interface CDOTA_BaseNPC {
	/**
	 * Define all common KV values for your unit here.
	 *
	 * *Only use enums or literal values.*
	 */
	BaseProperties: UnitBaseProperties;
	/**
	 * All abilities for this unit.
	 *
	 * You can either just list the abilities OR
	 * assign specific indeces to the abilities
	 */
	Abilities: UnitAbility[];
	/**
	 * You can define additional custom KV properties for your ability here.
	 *
	 * *Only use enums or literal values.*
	 */
	CustomProperties: CustomProperties;
	/**
	 * Should this ability be skipped in the automated ability creation?
	 */
	SkipUnit: boolean;
	/**
	 * Stuff to precache.
	 */
	PrecacheKV: PrecacheBlock;
}

type UnitAbility = CustomAbilities | string | UnitAbilityBlock;

interface UnitAbilityBlock {
	index:
		| 1
		| 2
		| 3
		| 4
		| 5
		| 6
		| 7
		| 8
		| 9
		| 10
		| 11
		| 12
		| 13
		| 14
		| 15
		| 16
		| 17
		| 18
		| 19
		| 20
		| 21
		| 22
		| 23
		| 24
		| 25;
	name: CustomAbilities | string;
}

interface TTest {
	hello: string;
}

interface UnitBaseProperties {
	/**
	 * A base class that custom unit will extend.
	 */
	BaseClass: string;
	/**
	 * Path to the vscripts file, that would be executed for each spawned unit.
	 * Unit is available in file's scope under `thisEntity` variable name.
	 */
	ScriptFile?: string;

	Model?: `${string}.vmdl`;
	ModelScale?: number;
	MaxModelScaleMultiplier?: number;
	VersusScale?: number;
	/**
	 * Used for Warlock's golem.
	 */
	LoadoutScale?: number;
	/**
	 * Only positive numbers.
	 */
	SpectatorLoadoutScale?: number;
	AlternateLoadoutScale?: number;
	TransformedLoadoutScale?: number;

	IdleExpression?: `scenes/${string}.vcd`;
	Portrait?: `vgui/${string}`;
	DrawParticlesWhileHidden?: boolean;
	AnimationModifier?: string;
	MinimapIcon?: string;
	MinimapIconSize?: number;
	UnitLabel?: string;
	Level?: number;

	GameSoundsFile?: `soundevents/${string}.vsndevts`;
	/**
	 * Name of sound event group.
	 */
	SoundSet?: string | 0;
	IdleSoundLoop?: string;
	VoiceFile?: `soundevents/${string}.vsndevts`;

	particle_folder?: `particles/${string}`;

	BoundsHullName?: HullSize;
	ProjectileCollisionSize?: number;
	RingRadius?: number;
	/**
	 * The height from the ground at which the health bar should be placed.
	 * By default this value is set to "-1" to use the models default height.
	 */
	HealthBarOffset?: number;

	IsSummoned?: boolean;
	IsNeutralUnitType?: boolean;
	IsAncient?: boolean;
	IsBoss?: boolean;
	IsRoshan?: boolean;
	/**
	 * @deprecated Used only in one unit - Undying's Tombstone.
	 */
	IsOther?: boolean;
	CanBeDominated?: boolean;
	ConsideredHero?: boolean;
	HasInventory?: boolean;
	ImmuneToOmnislash?: boolean;

	/**
	 * Unknown if it actually works.
	 */
	DisableDamageDisplay?: boolean;
	/**
	 * Unknown if it actually works.
	 */
	VisbibleInPortraitOnly?: boolean;
	/**
	 * Unknown if it actually works.
	 */
	LimitPathingSearchDepth?: boolean;
	/**
	 * Unknown if it actually works.
	 */
	IsBossMonster?: boolean;

	WakesNeutrals?: boolean;
	AutoAttacksByDefault?: boolean;
	UseNeutralCreepBehavior?: boolean;
	/**
	 * @deprecated Unused.
	 */
	RunAIWhenControllableByPlayer?: boolean;
	/**
	 * How much bots want to attack them vs other non-hero things
	 */
	AttackDesire?: number;
	PathfindingSearchDepthScale?: number;

	SelectionGroup?: string;
	SelectOnSpawn?: boolean;
	IgnoreAddSummonedToSelection?: boolean;

	AbilityLayout?: 4 | 5 | 6;

	ArmorPhysical?: number;
	MagicalResistance?: number;

	AttackCapabilities?: UnitAttackCapability;
	AttackDamageMin?: number;
	AttackDamageMax?: number;
	/**
	 * @deprecated The only valid value is default.
	 */
	AttackDamageType?: "DAMAGE_TYPE_ArmorPhysical";
	/**
	 * https://dota2.gamepedia.com/Attack_speed#Initial_Attack_Speed
	 */
	BaseAttackSpeed?: number;
	/**
	 * Base attack time of the unit.
	 */
	AttackRate?: number;
	/**
	 * Normalized time in animation cycle to attack.
	 */
	AttackAnimationPoint?: number;
	AttackAcquisitionRange?: number;
	AttackRange?: number;
	AttackRangeBuffer?: number;
	ProjectileModel?: `particles/${string}.vpcf` | "";
	ProjectileSpeed?: number | "";

	AttributePrimary?: Attributes;
	AttributeBaseStrength?: number;
	AttributeStrengthGain?: number;
	AttributeBaseIntelligence?: number;
	AttributeIntelligenceGain?: number;
	AttributeBaseAgility?: number;
	AttributeAgilityGain?: number;

	/**
	 * Experience granted on unit's death.
	 */
	BountyXP?: number;
	/**
	 * Min gold granted to the killer on unit's death.
	 */
	BountyGoldMin?: number;
	/**
	 * Max gold granted to the killer on unit's death.
	 */
	BountyGoldMax?: number;

	MovementCapabilities?: UnitMoveCapability;
	MovementSpeed?: number;
	MovementTurnRate?: number;
	/**
	 * Plays alternate idle/run animation when near enemies
	 */
	HasAggressiveStance?: boolean;
	/**
	 * Distance to keep when following.
	 */
	FollowRange?: number;

	/**
	 * Base health.
	 */
	StatusHealth?: number;
	/**
	 * Health regeneration rate.
	 */
	StatusHealthRegen?: number;
	/**
	 * Base mana.
	 */
	StatusMana?: number;
	/**
	 * Mana regeneration rate.
	 */
	StatusManaRegen?: number;
	/**
	 * Amount of mana unit spawns with. -1 means default to full mana.
	 */
	StatusStartingMana?: number;

	TeamName?: DotaTeam;
	CombatClassAttack?: CombatClassAttack;
	CombatClassDefend?: CombatClassDefend;
	/**
	 * @deprecated Unused.
	 */
	UnitRelationshipClass?: NpcUnitRelationshipType;

	/**
	 * Range of vision during day light.
	 */
	VisionDaytimeRange?: number;
	/**
	 * Range of vision at night time.
	 */
	VisionNighttimeRange?: number;

	AttackRangeActivityModifiers?: AttackRangeActivityModifiersBlock;

	/**
	 * Valid only when BaseClass is 'npc_dota_creature' or it's subclass.
	 */
	Creature?: CreatureBlock;
}

interface AttackRangeActivityModifiersBlock {
	attack_normal_range: number;
	attack_long_range: number;
}

interface CreatureBlock {
	AttachWearables?: CreatureWearable[];
	HPGain?: number;
	DamageGain?: number;
	ArmorGain?: number;
	ManaGain?: number;
	MagicResistGain?: number;
	MoveSpeedGain?: number;
	BountyGain?: number;
	XPGain?: number;
	DisableClumpingBehavior?: boolean;
	CanRespawn?: boolean;
	DisableResistance?: number;
	DefaultState?: number;
	States?: any;
	OffensiveAbilities?: any;
	DefensiveAbilities?: any;
	EscapeAbilities?: any;
	EquippedItems?: CreatureEquippedItem[];
}

interface CreatureWearable {
	ItemDef: number;
}

interface CreatureEquippedItem {
	Item: string;
	Charges?: number;
}

declare const enum HullSize {
	BARRACKS = "DOTA_HULL_SIZE_BARRACKS",
	BIG_HERO = "DOTA_HULL_SIZE_BIG_HERO",
	BUILDING = "DOTA_HULL_SIZE_BUILDING",
	FILLER = "DOTA_HULL_SIZE_FILLER",
	HERO = "DOTA_HULL_SIZE_HERO",
	HUGE = "DOTA_HULL_SIZE_HUGE",
	LARGE = "DOTA_HULL_SIZE_LARGE",
	REGULAR = "DOTA_HULL_SIZE_REGULAR",
	SIEGE = "DOTA_HULL_SIZE_SIEGE",
	SMALL = "DOTA_HULL_SIZE_SMALL",
	SMALLEST = "DOTA_HULL_SIZE_SMALLEST",
	TOWER = "DOTA_HULL_SIZE_TOWER",
}

declare const enum CombatClassAttack {
	BASIC = "DOTA_COMBAT_CLASS_ATTACK_BASIC",
	HERO = "DOTA_COMBAT_CLASS_ATTACK_HERO",
	PIERCE = "DOTA_COMBAT_CLASS_ATTACK_PIERCE",
	SIEGE = "DOTA_COMBAT_CLASS_ATTACK_SIEGE",
}

declare const enum CombatClassDefend {
	BASIC = "DOTA_COMBAT_CLASS_DEFEND_BASIC",
	HERO = "DOTA_COMBAT_CLASS_DEFEND_HERO",
	STRUCTURE = "DOTA_COMBAT_CLASS_DEFEND_STRUCTURE",
}

declare const enum NpcUnitRelationshipType {
	ATTACHED = "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_ATTACHED",
	BARRACKS = "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_BARRACKS",
	BUILDING = "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_BUILDING",
	COURIER = "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_COURIER",
	DEFAULT = "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_DEFAULT",
	HERO = "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_HERO",
	SIEGE = "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_SIEGE",
	WARD = "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_WARD",
}
