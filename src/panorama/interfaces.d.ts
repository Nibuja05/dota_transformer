interface OnKeybindChanged {
	name: string;
	key: string;
}

interface OnPanelChanged {
	name: string;
	state: Short;
}

interface OnGlobalValueChanged {
	name: string;
}

declare const enum TutorialState {
	PAUSED = -1,
	NOT_STARTED = 0,
	INTRO = 1,
	RUNES_SELECTION = 2,
	RUNES = 3,
	SHARDS = 4,
	MOVE = 5,
	SHOP = 6,
	UPGRADE = 7,
	FUSION = 8,
	CRAFT = 9,
}

type TutorialOnetimes = TutorialState.SHOP | TutorialState.UPGRADE | TutorialState.FUSION | TutorialState.CRAFT;

interface OnForceOnetimeTriggerEvent {
	state: TutorialOnetimes;
}

interface GameEventDeclarations {
	on_keybind_changed: OnKeybindChanged;
	on_panel_changed: OnPanelChanged;
	on_global_value_changed: OnGlobalValueChanged;
	on_weapon_moved: {};
	on_process_confirm: {};
	on_continue_tutorial: {};
	on_force_onetime_trigger: OnForceOnetimeTriggerEvent;
}
// interface GameEventDeclarations {
// 	test: string;
// }

interface DragStartEvent {
	removePositionBeforeDrop: boolean;
	offsetY: number;
	offsetX: number;
}

declare const enum ShopTab {
	"Market" = "Market",
	"Anvil" = "Anvil",
	"Altar" = "Altar",
}

declare const enum AnvilType {
	"Absorb" = "AnvilAbsorbSelect",
	"Enchant" = "AnvilUpgradeSelect",
	"Recycle" = "AnvilRecycleSelect",
}

declare const enum PhaseName {
	Preparation = "PreparationPhase",
	Wave = "WavePhase",
	Starting = "StartingPhase",
	Overtime = "OvertimePhase",
	BattleOvertime = "BattleOvertimePhase",
	ExtremeOvertime = "ExtremeOvertimePhase",
}

interface CDOTA_PanoramaScript_GameUI {
	SetCameraTarget(nTargetEntIndex: EntityIndex | -1): void;
}

interface RankingRewards {
	shardCount: number;
	gold: number;
	rune: boolean;
}

declare const enum SliderTypes {
	SLIDER = "slider",
	VALUE = "value",
}

interface PanelBounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

declare const enum RuneCardValueType {
	Damage = "damage",
	Interval = "interval",
	Behavior = "behavior",
	Effect = "effect",
	Special = "special",
}

interface SpecialStartRuneDescription {
	properties: string;
	description: string;
	behavior: string;
	effect?: string;
	special: string;
}

declare const enum TutorialBoxTooltipDirection {
	UP = "Up",
	DOWN = "Down",
	LEFT = "Left",
	RIGHT = "Right",
}
