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

interface CDOTA_BaseNPC_Hero {
	/**
	 * Define all common KV values for your unit here.
	 *
	 * *Only use enums or literal values.*
	 */
	BaseProperties: HeroBaseProperties;
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
	BaseClass?: UnitBaseClasses;
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

	AttackRangeActivityModifiers?: Partial<{ [range in AttackRangeNames]: number }>;

	/**
	 * Valid only when BaseClass is 'npc_dota_creature' or it's subclass.
	 */
	Creature?: CreatureBlock;
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

declare const enum UnitBaseClasses {
	Thinker = "npc_dota_thinker",
	Companion = "npc_dota_companion",
	Base = "npc_dota_base",
	Creep_lane = "npc_dota_creep_lane",
	Tower = "npc_dota_tower",
	Watch_tower = "npc_dota_watch_tower",
	Filler = "npc_dota_filler",
	Healer = "npc_dota_healer",
	Building = "npc_dota_building",
	Fort = "npc_dota_fort",
	Creep_siege = "npc_dota_creep_siege",
	Ent_dota_fountain = "ent_dota_fountain",
	Base_additive = "npc_dota_base_additive",
	Zeus_cloud = "npc_dota_zeus_cloud",
	Tusk_frozen_sigil = "npc_dota_tusk_frozen_sigil",
	Elder_titan_ancestral_spirit = "npc_dota_elder_titan_ancestral_spirit",
	Creep_neutral = "npc_dota_creep_neutral",
	Creep = "npc_dota_creep",
	Ward_base = "npc_dota_ward_base",
	Ward_base_truesight = "npc_dota_ward_base_truesight",
	Courier = "npc_dota_courier",
	Flying_courier = "npc_dota_flying_courier",
	Witch_doctor_death_ward = "npc_dota_witch_doctor_death_ward",
	Shadowshaman_serpentward = "npc_dota_shadowshaman_serpentward",
	Venomancer_plagueward = "npc_dota_venomancer_plagueward",
	Invoker_forged_spirit = "npc_dota_invoker_forged_spirit",
	Broodmother_spiderling = "npc_dota_broodmother_spiderling",
	Clinkz_skeleton_archer = "npc_dota_clinkz_skeleton_archer",
	Roshan = "npc_dota_roshan",
	Roshan_halloween = "npc_dota_roshan_halloween",
	Ent_dota_radiant_candybucket = "ent_dota_radiant_candybucket",
	Warlock_golem = "npc_dota_warlock_golem",
	Beastmaster_hawk = "npc_dota_beastmaster_hawk",
	Beastmaster_boar = "npc_dota_beastmaster_boar",
	Brewmaster_earth = "npc_dota_brewmaster_earth",
	Brewmaster_storm = "npc_dota_brewmaster_storm",
	Brewmaster_fire = "npc_dota_brewmaster_fire",
	Brewmaster_void = "npc_dota_brewmaster_void",
	Unit_undying_tombstone = "npc_dota_unit_undying_tombstone",
	Unit_undying_zombie = "npc_dota_unit_undying_zombie",
	Rattletrap_cog = "npc_dota_rattletrap_cog",
	Broodmother_web = "npc_dota_broodmother_web",
	Earth_spirit_stone = "npc_dota_earth_spirit_stone",
	Lone_druid_bear = "npc_dota_lone_druid_bear",
	Visage_familiar = "npc_dota_visage_familiar",
	Ent_dota_halloffame = "ent_dota_halloffame",
	Ent_dota_promo = "ent_dota_promo",
	Wisp_spirit = "npc_dota_wisp_spirit",
	Creep_diretide = "npc_dota_creep_diretide",
	Roquelaire = "npc_dota_roquelaire",
	Greevil = "npc_dota_greevil",
	Loot_greevil = "npc_dota_loot_greevil",
	Greevil_miniboss_black = "npc_dota_greevil_miniboss_black",
	Greevil_miniboss_blue = "npc_dota_greevil_miniboss_blue",
	Greevil_miniboss_red = "npc_dota_greevil_miniboss_red",
	Greevil_miniboss_yellow = "npc_dota_greevil_miniboss_yellow",
	Greevil_miniboss_white = "npc_dota_greevil_miniboss_white",
	Greevil_minion_white = "npc_dota_greevil_minion_white",
	Greevil_minion_black = "npc_dota_greevil_minion_black",
	Greevil_minion_red = "npc_dota_greevil_minion_red",
	Greevil_minion_blue = "npc_dota_greevil_minion_blue",
	Greevil_minion_yellow = "npc_dota_greevil_minion_yellow",
	Greevil_miniboss_green = "npc_dota_greevil_miniboss_green",
	Greevil_miniboss_orange = "npc_dota_greevil_miniboss_orange",
	Greevil_miniboss_purple = "npc_dota_greevil_miniboss_purple",
	Greevil_minion_orange = "npc_dota_greevil_minion_orange",
	Greevil_minion_purple = "npc_dota_greevil_minion_purple",
	Greevil_minion_green = "npc_dota_greevil_minion_green",
	Ignis_fatuus = "npc_dota_ignis_fatuus",
	Target_dummy = "npc_dota_target_dummy",
	Looping_sound = "npc_dota_looping_sound",
	Techies_mines = "npc_dota_techies_mines",
	Techies_minefield_sign = "npc_dota_techies_minefield_sign",
	Treant_eyes = "npc_dota_treant_eyes",
	Lich_ice_spire = "npc_dota_lich_ice_spire",
	Phantomassassin_gravestone = "npc_dota_phantomassassin_gravestone",
	Phantom_assassin_ground_dagger = "npc_dota_phantom_assassin_ground_dagger",
	Cny_beast = "npc_dota_cny_beast",
	Error = "npc_dota_error",
	Dark_willow_creature = "npc_dota_dark_willow_creature",
	Seasonal_snowman = "npc_dota_seasonal_snowman",
	Frostivus2018_snowman = "npc_dota_frostivus2018_snowman",
	Seasonal_dragon = "npc_dota_seasonal_dragon",
	Seasonal_cny_balloon = "npc_dota_seasonal_cny_balloon",
	Seasonal_ti9_balloon = "npc_dota_seasonal_ti9_balloon",
	Seasonal_ti9_drums = "npc_dota_seasonal_ti9_drums",
	Seasonal_ti9_monkey = "npc_dota_seasonal_ti9_monkey",
	Creature = "npc_dota_creature",
	Seasonal_ti10_disco_ball = "npc_dota_seasonal_ti10_disco_ball",
	Seasonal_ti10_soccer_ball = "npc_dota_seasonal_ti10_soccer_ball",
	Unit_underlord_portal = "npc_dota_unit_underlord_portal",
	Broodmother_sticky_web = "npc_dota_broodmother_sticky_web",
}

type HeroBaseProperties = Omit<Omit<UnitBaseProperties, "BaseClass">, "ScriptFile"> & {
	/**
	 * A standard name of the hero that would be overriden.
	 */
	override_hero?: string;

	Model1?: `${string}.vmdl`;
	Model2?: `${string}.vmdl`;
	Model3?: `${string}.vmdl`;

	Persona?: {
		[index: number]: {
			name: `npc_dota_hero_${string}`;
			/**
			 * For tools only.
			 */
			Model: `${string}.vmdl`;
		};
	};

	AbilityTalentStart?: number;

	// Ability Draft Stuff (mostly useless)
	AbilityDraftDisabled?: boolean;
	AbilityDraftIgnoreCount?: number;
	AbilityDraftAbilities?: {
		[abilityName: `Ability${number}`]: string;
	};
	AbilityDraftUniqueAbilities?: {
		[abilityName: `Ability${number}`]: string;
	};

	Enabled?: boolean;
	CMEnabled?: boolean;

	/**
	 * 1 - 255
	 */
	HeroID?: number;
	HeroOrderID?: number;
	SimilarHeroes?: string;

	new_player_enable?: boolean;
	NameAliases?: string;
	workshop_guide_name?: string;
	NewHero?: boolean;
	ReleaseTimestamp?: number;
	Legs?: number;
	Team?: "Good" | "Bad";
	Complexity?: number;

	/**
	 * Comma seperated roles.
	 */
	Role?: "";
	/**
	 * Either a number for all OR comma seperated numbers;
	 */
	RoleLevels?: number | string;

	GibType?: "default" | "ethereal" | "goo" | "motor" | "ice" | "fire" | "electric" | "wood" | "stone";
	GibTintColor?: [number, number, number, number];
	LastHitChallengeRival?: `npc_${string}_hero_${string}`;
	HeroGlowColor?: [number, number, number];
	BotImplemented?: boolean;
	BotForceSelection?: boolean;
	Press?: boolean;
	HeroPool1?: boolean;
	HeroPool2?: boolean;
	HeroUnlockOrder?: number;
	CMTournamentIgnore?: boolean;
	NoCombine?: boolean;
	ARDMDisabled?: boolean;

	AttackSpeedActivityModifiers?: Partial<{
		[speed in AttackSpeedNames]: number;
	}>;
	MovementSpeedActivityModifiers?: Partial<{ [movement in MovementSpeedNames]: number }>;
	AttackRangeActivityModifiers?: Partial<{ [range in AttackRangeNames]: number }>;

	/**
	 * Example:
	 * ```Valve KeyValues File
	 * "animation_transitions"
	 *	{
	 *		"ACT_DOTA_RUN"
	 *		{
	 *			"regular"		"0.300000"
	 *		}
	 *		"ACT_DOTA_IDLE"
	 *		{
	 *			"regular"		"0.55000"
	 *		}
	 *	}
	 * ```
	 */
	animation_transitions?: {
		[animation: string]: {
			[modifier: string]: number;
		};
	};

	RenderablePortrait?: {
		Paricles?: {
			[name: `${string}.vpcf`]: "loadout";
		};
	};

	AbilityPreview?: {
		resource: `resource/${string}.res`;
		movie: `media/heroes/${string}`;
	};

	ItemSlots?: ItemSlots;
	Bot?: Bot;
	HUD?: any;

	PickSound?: string;
	BanSound?: string;
	HeroSelectSoundEffect?: string;
	VoiceBackgroundSound?: string;
};

interface ItemSlots {
	[index: number]: {
		SlotIndex: number;
		SlotName: string;
		SlotText: `#LoadoutSlot_${string}`;
		no_import?: boolean;
		TextureWidth?: number;
		TextureHeight?: number;
		MaxPolygonsLOD0?: number;
		MaxPolygonsLOD1?: number;
		MaxBonesLOD0?: number;
		MaxBonesLOD1?: number;
		DisplayInLoadout?: boolean;
		LoadoutPreviewMode?: "hero_model_override" | "hero" | "particle" | "transformation";
		CanBeUsedAsGeneratingSlot?: boolean;
		ShowItemOnGeneratedUnits?: boolean;
		GeneratesUnits?: {
			[index: number]: `npc_dota_${string}`;
		};
	};
}

interface Bot {
	SupportsEasyMode?: boolean;
	Loadout?: {
		[name: `item_${string}`]: BotItemType;
	};
	/**
	 * Abilities learned on levels.
	 */
	Build?: {
		[index: number]: string;
	};
	HeroType?: BotHeroType;
	AggressionFactor?: number;
	LaningInfo?: {
		SoloDesire?: number;
		RequiresBabysit?: number;
		ProvidesBabysit?: number;
		SurvivalRating?: number;
		RequiresFarm?: number;
		ProvidesSetup?: number;
		RequiresSetup?: number;
	};
}

declare const enum BotItemType {
	CONSUMABLE = "ITEM_CONSUMABLE",
	CORE = "ITEM_CORE",
	DERIVED = "ITEM_DERIVED",
	EXTENSION = "ITEM_EXTENSION",
	LUXURY = "ITEM_LUXURY",
	SELLABLE = "ITEM_SELLABLE",
}

declare const enum BotHeroType {
	GANKER = "DOTA_BOT_GANKER",
	HARD_CARRY = "DOTA_BOT_HARD_CARRY",
	NUKER = "DOTA_BOT_NUKER",
	PURE_SUPPORT = "DOTA_BOT_PURE_SUPPORT",
	PUSH_SUPPORT = "DOTA_BOT_PUSH_SUPPORT",
	SEMI_CARRY = "DOTA_BOT_SEMI_CARRY",
	STUN_SUPPORT = "DOTA_BOT_STUN_SUPPORT",
	TANK = "DOTA_BOT_TANK",
	SUPPORT = "DOTA_BOT_SUPPORT",
}

declare const enum AttackSpeedNames {
	fast = "fast",
	faster = "faster",
	fastest = "fastest",
	superfast = "superfast",
	megafast = "megafast",
}

declare const enum MovementSpeedNames {
	walk = "walk",
	run = "run",
	run_fast = "run_fast",
	run_haste = "run_haste",
	sprint = "sprint",
	trot = "trot",
	jog = "jog",
	"<none>" = "<none>",
}

declare const enum AttackRangeNames {
	attack_closest_range = "attack_closest_range",
	attack_close_range = "attack_close_range",
	attack_short_range = "attack_short_range",
	attack_normal_range = "attack_normal_range",
	attack_medium_range = "attack_medium_range",
	attack_long_range = "attack_long_range",
}
