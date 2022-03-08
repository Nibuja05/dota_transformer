import { BaseHero, registerHero } from "../lib/dota_ts_adapter";

@registerHero()
export class my_test_hero extends BaseHero {
	SkipUnit: boolean = false;

	BaseProperties: HeroBaseProperties = {
		override_hero: "npc_dota_wisp",
		ArmorPhysical: 1,
		AttackCapabilities: UnitAttackCapability.RANGED_ATTACK,
		AttackDamageMin: 30,
		AttackDamageMax: 36,
		AttackRate: 1.6,
		AttackAnimationPoint: 0.4,
		AttackAcquisitionRange: 800,
		AttackRange: 500,
	};
	Abilities: UnitAbility[] = ["meepo_earthbind_ts_example", "", "", ""];

	CustomProperties: CustomProperties = {
		TestProperty: "Test",
	};

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
