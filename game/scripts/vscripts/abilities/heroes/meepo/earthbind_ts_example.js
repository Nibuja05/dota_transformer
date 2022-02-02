var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseAbility, registerAbility } from "../../../lib/dota_ts_adapter";
let meepo_earthbind_ts_example = class meepo_earthbind_ts_example extends BaseAbility {
    particle;
    SkipAbility = false;
    SpecialValues = {
        duration: 2,
        radius: 220,
        speed: 857,
        tooltip_range: 1250,
        cooldown: {
            value: [20, 18, 16, 8],
            LinkedSpecialBonus: "special_bonus_unique_meepo3",
        },
    };
    BaseProperties = {
        TextureName: "meepo_earthbind",
        Behavior: [DOTA_ABILITY_BEHAVIOR_AOE, DOTA_ABILITY_BEHAVIOR_POINT, DOTA_ABILITY_BEHAVIOR_IGNORE_BACKSWING],
        SpellImmunityType: SpellImmunityTypes.ENEMIES_NO,
        FightRecapLevel: 1,
        Sound: "Hero_Meepo.Earthbind.Cast",
        CastRange: 1250,
        CastPoint: 0.3,
        Cooldown: "cooldown",
        ManaCost: [120, 130, 140, 150],
        Type: ABILITY_TYPE_BASIC,
    };
    CustomProperties = {
        MyVar: 5,
    };
    GetCooldown() {
        let cooldown = this.GetSpecialValueFor("cooldown");
        if (IsServer()) {
            const talent = this.GetCaster().FindAbilityByName("special_bonus_unique_meepo_3");
            if (talent) {
                cooldown -= talent.GetSpecialValueFor("value");
            }
        }
        return cooldown;
    }
    OnAbilityPhaseStart() {
        if (IsServer()) {
            this.GetCaster().EmitSound("Hero_Meepo.Earthbind.Cast");
        }
        return true;
    }
    OnAbilityPhaseInterrupted() {
        this.GetCaster().StopSound("Hero_Meepo.Earthbind.Cast");
    }
    OnSpellStart() {
        const caster = this.GetCaster();
        const point = this.GetCursorPosition();
        const projectileSpeed = this.GetSpecialValueFor("speed");
        const direction = (point - caster.GetAbsOrigin()).Normalized();
        direction.z = 0;
        const distance = (point - caster.GetAbsOrigin()).Length();
        const radius = this.GetSpecialValueFor("radius");
        this.particle = ParticleManager.CreateParticle("particles/units/heroes/hero_meepo/meepo_earthbind_projectile_fx.vpcf", PATTACH_CUSTOMORIGIN, caster);
        ParticleManager.SetParticleControl(this.particle, 0, caster.GetAbsOrigin());
        ParticleManager.SetParticleControl(this.particle, 1, point);
        ParticleManager.SetParticleControl(this.particle, 2, Vector(projectileSpeed, 0, 0));
        ProjectileManager.CreateLinearProjectile({
            Ability: this,
            EffectName: "",
            vSpawnOrigin: caster.GetAbsOrigin(),
            fDistance: distance,
            fStartRadius: radius,
            fEndRadius: radius,
            Source: caster,
            bHasFrontalCone: false,
            iUnitTargetTeam: DOTA_UNIT_TARGET_TEAM_NONE,
            iUnitTargetFlags: DOTA_UNIT_TARGET_FLAG_NONE,
            iUnitTargetType: DOTA_UNIT_TARGET_NONE,
            vVelocity: (direction * projectileSpeed),
            bProvidesVision: true,
            iVisionRadius: radius,
            iVisionTeamNumber: caster.GetTeamNumber(),
        });
    }
    OnProjectileHit(_target, location) {
        const caster = this.GetCaster();
        const duration = this.GetSpecialValueFor("duration");
        const radius = this.GetSpecialValueFor("radius");
        const units = FindUnitsInRadius(caster.GetTeamNumber(), location, undefined, radius, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_BASIC | DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, 0, false);
        for (const unit of units) {
            unit.AddNewModifier(caster, this, "modifier_meepo_earthbind", { duration });
            unit.EmitSound("Hero_Meepo.Earthbind.Target");
        }
        ParticleManager.DestroyParticle(this.particle, false);
        ParticleManager.ReleaseParticleIndex(this.particle);
        return true;
    }
};
meepo_earthbind_ts_example = __decorate([
    registerAbility()
], meepo_earthbind_ts_example);
export { meepo_earthbind_ts_example };
