/// <reference types="@moddota/dota-lua-types/normalized" />
/// <reference types="dota_transformer" />
export interface BaseAbility extends CDOTA_Ability_Lua {
}
export declare class BaseAbility {
}
export interface BaseItem extends CDOTA_Item_Lua {
}
export declare class BaseItem {
}
export interface BaseModifier extends CDOTA_Modifier_Lua {
}
export declare class BaseModifier {
    static apply<T extends typeof BaseModifier>(this: T, target: CDOTA_BaseNPC, caster?: CDOTA_BaseNPC, ability?: CDOTABaseAbility, modifierTable?: object): InstanceType<T>;
}
export interface BaseModifierMotionHorizontal extends CDOTA_Modifier_Lua_Horizontal_Motion {
}
export declare class BaseModifierMotionHorizontal extends BaseModifier {
}
export interface BaseModifierMotionVertical extends CDOTA_Modifier_Lua_Vertical_Motion {
}
export declare class BaseModifierMotionVertical extends BaseModifier {
}
export interface BaseModifierMotionBoth extends CDOTA_Modifier_Lua_Motion_Both {
}
export declare class BaseModifierMotionBoth extends BaseModifier {
}
export declare const registerAbility: (name?: string | undefined) => (ability: new () => CDOTA_Ability_Lua | CDOTA_Item_Lua) => void;
export declare const registerModifier: (name?: string | undefined) => (modifier: new () => CDOTA_Modifier_Lua) => void;
/**
 * Use to expose top-level functions in entity scripts.
 * Usage: registerEntityFunction("OnStartTouch", (trigger: TriggerStartTouchEvent) => { <your code here> });
 */
export declare function registerEntityFunction(name: string, f: (...args: any[]) => any): void;
