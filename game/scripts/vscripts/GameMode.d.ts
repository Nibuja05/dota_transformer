/// <reference types="@moddota/dota-lua-types/normalized" />
declare global {
    interface CDOTAGamerules {
        Addon: GameMode;
    }
}
export declare class GameMode {
    static Precache(this: void, context: CScriptPrecacheContext): void;
    static Activate(this: void): void;
    constructor();
    private configure;
    OnStateChange(): void;
    private StartGame;
    Reload(): void;
    private OnNpcSpawned;
}
