import { BaseUnit, registerUnit } from "../lib/dota_ts_adapter";

export class my_base_unit extends BaseUnit {
	BaseProperties: UnitBaseProperties = {
		BaseClass: UnitBaseClasses.Creature,
		Model: "models/creeps/neutral_creeps/n_creep_gnoll/n_creep_gnoll_frost.vmdl",
	};
}

@registerUnit()
export class my_test_unit extends my_base_unit {
	SkipUnit: boolean = false;

	BaseProperties: UnitBaseProperties = {
		// Model: "models/creeps/neutral_creeps/n_creep_gnoll/n_creep_gnoll_frost.vmdl",
		SoundSet: "n_creep_Ranged",
		GameSoundsFile: "soundevents/game_sounds_creeps.vsndevts",
		Level: 1,
		ModelScale: 0.9,
		ArmorPhysical: 1,
		AttackCapabilities: UnitAttackCapability.RANGED_ATTACK,
		AttackDamageMin: 30,
		AttackDamageMax: 36,
		AttackRate: 1.6,
		AttackAnimationPoint: 0.4,
		AttackAcquisitionRange: 800,
		AttackRange: 500,
		ProjectileModel: "particles/neutral_fx/gnoll_base_attack.vpcf",
		ProjectileSpeed: 1500,
		RingRadius: 40,
		HealthBarOffset: 170,
		BountyXP: 24,
		BountyGoldMin: 24,
		BountyGoldMax: 29,
		MovementCapabilities: UnitMoveCapability.GROUND,
		MovementSpeed: 270,
		StatusHealth: 75,
		StatusHealthRegen: 0.5,
		StatusMana: 0,
		StatusManaRegen: 0,
		VisionDaytimeRange: 400,
		VisionNighttimeRange: 400,
		TeamName: DotaTeam.NEUTRALS,
		CombatClassAttack: CombatClassAttack.PIERCE,
		CombatClassDefend: CombatClassDefend.BASIC,
		UnitRelationshipClass: NpcUnitRelationshipType.DEFAULT,

		Creature: {
			HPGain: 50,
			DamageGain: 2,
			ArmorGain: 0.25,
			MagicResistGain: 0.1,
			MoveSpeedGain: 1,
			BountyGain: 3,
			XPGain: 15,
		},
	};
	Abilities: UnitAbility[] = ["", "", "", ""];

	CustomProperties: CustomProperties = {
		TestProperty: "Test",
	};

	testFunc() {
		print("TEST");
	}

	public OnSpawn(): void {
		print("Overwritten Spawn!");
	}

	public OnHurt(
		attacker: CDOTA_BaseNPC | undefined,
		inflictor: CDOTABaseAbility | undefined,
		damage: number,
		damageBits: number
	): void {
		const attackerName = attacker ? attacker.GetUnitName() : "None";
		const inflictorName = inflictor ? inflictor.GetName() : "Nothing";
		print(`Hurt by ${attackerName} with ${inflictorName} for ${damage} damage!`);
	}

	public OnDeath(
		attacker: CDOTA_BaseNPC | undefined,
		inflictor: CDOTABaseAbility | undefined,
		damageBits: number
	): void {
		print("Dead!");
		if (attacker) print("Killed by" + attacker.GetUnitName());
	}
}
