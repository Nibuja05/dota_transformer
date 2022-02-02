/// <reference types="@moddota/dota-lua-types/normalized" />
/// <reference types="dota_transformer" />
import { BaseAbility } from "../../../lib/dota_ts_adapter";
export declare class meepo_earthbind_ts_example extends BaseAbility {
    particle?: ParticleID;
    SkipAbility: boolean;
    SpecialValues: AbilitySpecials;
    BaseProperties: AbilityBaseProperties;
    CustomProperties: AbilityCustomProperties;
    GetCooldown(): number;
    OnAbilityPhaseStart(): boolean;
    OnAbilityPhaseInterrupted(): void;
    OnSpellStart(): void;
    OnProjectileHit(_target: CDOTA_BaseNPC, location: Vector): boolean;
}
