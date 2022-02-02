var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseModifier, registerModifier } from "../lib/dota_ts_adapter";
// Base speed modifier -- Could be moved to a separate file
class ModifierSpeed extends BaseModifier {
    // Declare functions
    DeclareFunctions() {
        return [MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE];
    }
    GetModifierMoveSpeed_Absolute() {
        return 300;
    }
}
let modifier_panic = class modifier_panic extends ModifierSpeed {
    // Set state
    CheckState() {
        return {
            [MODIFIER_STATE_COMMAND_RESTRICTED]: true,
        };
    }
    // Override speed given by Modifier_Speed
    GetModifierMoveSpeed_Absolute() {
        return 540;
    }
    // Run when modifier instance is created
    OnCreated() {
        if (IsServer()) {
            // Think every 0.3 seconds
            this.StartIntervalThink(0.3);
        }
    }
    // Called when intervalThink is triggered
    OnIntervalThink() {
        const parent = this.GetParent();
        parent.MoveToPosition((parent.GetAbsOrigin() + RandomVector(400)));
    }
};
modifier_panic = __decorate([
    registerModifier()
], modifier_panic);
export { modifier_panic };
