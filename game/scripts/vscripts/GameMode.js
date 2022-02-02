var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GameMode_1;
import { reloadable } from "./lib/tstl-utils";
import { modifier_panic } from "./modifiers/modifier_panic";
const heroSelectionTime = 20;
let GameMode = GameMode_1 = class GameMode {
    static Precache(context) {
        PrecacheResource("particle", "particles/units/heroes/hero_meepo/meepo_earthbind_projectile_fx.vpcf", context);
        PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_meepo.vsndevts", context);
    }
    static Activate() {
        // When the addon activates, create a new instance of this GameMode class.
        GameRules.Addon = new GameMode_1();
    }
    constructor() {
        this.configure();
        // Register event listeners for dota engine events
        ListenToGameEvent("game_rules_state_change", () => this.OnStateChange(), undefined);
        ListenToGameEvent("npc_spawned", event => this.OnNpcSpawned(event), undefined);
        // Register event listeners for events from the UI
        CustomGameEventManager.RegisterListener("ui_panel_closed", (_, data) => {
            print(`Player ${data.PlayerID} has closed their UI panel.`);
            // Respond by sending back an example event
            const player = PlayerResource.GetPlayer(data.PlayerID);
            CustomGameEventManager.Send_ServerToPlayer(player, "example_event", {
                myNumber: 42,
                myBoolean: true,
                myString: "Hello!",
                myArrayOfNumbers: [1.414, 2.718, 3.142]
            });
            // Also apply the panic modifier to the sending player's hero
            const hero = player.GetAssignedHero();
            hero.AddNewModifier(hero, undefined, modifier_panic.name, { duration: 5 });
        });
    }
    configure() {
        GameRules.SetCustomGameTeamMaxPlayers(DOTA_TEAM_GOODGUYS, 3);
        GameRules.SetCustomGameTeamMaxPlayers(DOTA_TEAM_BADGUYS, 3);
        GameRules.SetShowcaseTime(0);
        GameRules.SetHeroSelectionTime(heroSelectionTime);
    }
    OnStateChange() {
        const state = GameRules.State_Get();
        // Add 4 bots to lobby in tools
        if (IsInToolsMode() && state == DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP) {
            for (let i = 0; i < 4; i++) {
                Tutorial.AddBot("npc_dota_hero_lina", "", "", false);
            }
        }
        if (state === DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP) {
            // Automatically skip setup in tools
            if (IsInToolsMode()) {
                Timers.CreateTimer(3, () => {
                    GameRules.FinishCustomGameSetup();
                });
            }
        }
        // Start game once pregame hits
        if (state === DOTA_GAMERULES_STATE_PRE_GAME) {
            Timers.CreateTimer(0.2, () => this.StartGame());
        }
    }
    StartGame() {
        print("Game starting!");
        // Do some stuff here
    }
    // Called on script_reload
    Reload() {
        print("Script reloaded!");
        // Do some stuff here
    }
    OnNpcSpawned(event) {
        // After a hero unit spawns, apply modifier_panic for 8 seconds
        const unit = EntIndexToHScript(event.entindex); // Cast to npc since this is the 'npc_spawned' event
        // Give all real heroes (not illusions) the meepo_earthbind_ts_example spell
        if (unit.IsRealHero()) {
            if (!unit.HasAbility("meepo_earthbind_ts_example")) {
                // Add lua ability to the unit
                unit.AddAbility("meepo_earthbind_ts_example");
            }
        }
    }
};
GameMode = GameMode_1 = __decorate([
    reloadable
], GameMode);
export { GameMode };
