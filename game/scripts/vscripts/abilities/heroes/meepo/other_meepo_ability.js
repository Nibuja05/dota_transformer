var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseAbility, registerAbility } from "../../../lib/dota_ts_adapter";
let other_meepo_ability = class other_meepo_ability extends BaseAbility {
    particle;
    texture = "other_meepo_ability";
    SkipAbility = false;
    BaseProperties = {
        Behavior: [DOTA_ABILITY_BEHAVIOR_HIDDEN, DOTA_ABILITY_BEHAVIOR_IGNORE_SILENCE],
    };
};
other_meepo_ability = __decorate([
    registerAbility()
], other_meepo_ability);
export { other_meepo_ability };
