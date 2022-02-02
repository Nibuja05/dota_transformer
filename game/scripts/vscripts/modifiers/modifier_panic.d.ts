/// <reference types="@moddota/dota-lua-types/normalized" />
import { BaseModifier } from "../lib/dota_ts_adapter";
declare class ModifierSpeed extends BaseModifier {
    DeclareFunctions(): ModifierFunction[];
    GetModifierMoveSpeed_Absolute(): number;
}
export declare class modifier_panic extends ModifierSpeed {
    CheckState(): Partial<Record<modifierstate, boolean>>;
    GetModifierMoveSpeed_Absolute(): number;
    OnCreated(): void;
    OnIntervalThink(): void;
}
export {};
