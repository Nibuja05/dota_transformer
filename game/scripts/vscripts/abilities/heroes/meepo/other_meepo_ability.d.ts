/// <reference types="@moddota/dota-lua-types/normalized" />
/// <reference types="dota_transformer" />
import { BaseAbility } from "../../../lib/dota_ts_adapter";
export declare class other_meepo_ability extends BaseAbility {
    particle?: ParticleID;
    texture: string;
    SkipAbility: boolean;
    BaseProperties: AbilityBaseProperties;
}
