import CONSTANTS from "./constants";

export class SystemCreatures {
	[key: string]: { [key: string]: Creature[] | Function };
}

// export class Creatures {
//   [key: string]: Creature[]|FunctionCreature;
// }

export class Creature {
	creature: string;
	number: number;
	level?: number;
	animation?: string;
}

export class TokenRevertData {
	actorId: string;
	id: string;
}

// export class CreatureData{
//   animation:string;
//   level:number;
// }

// const createCreature = function(data:CreatureData):Creature[]{
//   return [];
// }

// type FunctionCreature = ReturnType<typeof createCreature>

export enum PolymorpherFlags {
	// IS_LOCAL = 'isLocal',
	// STORE_ON_ACTOR = 'storeonactor',
	POLYMORPHERS = "polymorphers",
	RANDOM = "random",
	ORDERED = "ordered",
	COMPENDIUM = "compendium",
	// UPDATES_FOR_REVERT = 'updatesforrevert',
	MUTATION_NAMES_FOR_REVERT = "mutationNamesForRevert",
	TRANSFORMER_OPTIONS = "transformOptions",
	// ORIGINAL FLAG DND5E
	IS_POLYMORPHED = "isPolymorphed",
	ORIGINAL_ACTOR = "originalActor",
	PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR = "previousOriginalActor",
	// NEW_CREATED_ACTOR_TO_DELETE = 'newCreatedActorToDelete',
}

export class PolymorpherData {
	uuid: string;
	id: string;
	name: string;
	animation: string;
	number: number;
	defaultsummontype: string;
	compendiumid: string;
	explicitname: string;
}

export class PolymorpherCompendiumData {
	id: string;
	name: string;
	selected: boolean;
}

export class TransformOptionsGeneric {
	keepPhysical = false;
	keepMental = false;
	keepSaves = false;
	keepSkills = false;
	mergeSaves = false;
	mergeSkills = false;
	keepClass = false;
	keepFeats = false;
	keepSpells = false;
	keepItems = false;
	keepBio = false;
	keepVision = false;
	keepSelf = false;
	keepAE = false;
	// removeAE = false;
	// keepAEOnlyOriginNotEquipment = false;
	keepOtherOriginAE = true;
	keepOriginAE = true;
	keepEquipmentAE = true;
	keepFeatAE = true;
	keepSpellAE = true;
	keepClassAE = true;
	keepBackgroundAE = true;
	//
	transformTokens = true;
	explicitName = "";
}

/* pf2e */

// interface SenseDataPf2e {
//   type: SenseTypePf2e;
//   acuity?: SenseAcuityPf2e;
//   value: string;
//   source?: string;
// }

// export type SenseAcuityPf2e = typeof SENSE_ACUITIES_Pf2e[number];
// export type SenseTypePf2e = typeof SENSE_TYPES_Pf2e[number];

// export const BASIC_SENSE_TYPES_Pf2e = [
//   "darkvision",
//   "echolocation",
//   "greaterDarkvision",
//   "lifesense",
//   "lowLightVision",
//   "motionsense",
//   "scent",
//   "tremorsense",
//   "wavesense",
// ] as const;

// export const SENSE_TYPES_Pf2e = [...BASIC_SENSE_TYPES_Pf2e] as const;

// // "darkvision, scent (imprecise) 60 feet"
// export const SENSE_ACUITIES_Pf2e = ["precise", "imprecise", "vague"];

/**
 * Settings to configure how actors are merged when preset polymorphing is applied.
 * @enum {object}
 */
export const transformationPresets = {
	wildshape: {
		icon: '<i class="fas fa-paw"></i>',
		label: `${CONSTANTS.MODULE_NAME}.polymorphWildShape`,
		options: {
			keepBio: true,
			keepClass: true,
			keepMental: true,
			mergeSaves: true,
			mergeSkills: true,
			keepEquipmentAE: false,
		},
	},
	polymorph: {
		icon: '<i class="fas fa-pastafarianism"></i>',
		label: `${CONSTANTS.MODULE_NAME}.polymorph`,
		options: {
			keepEquipmentAE: false,
			keepClassAE: false,
			keepFeatAE: false,
			keepBackgroundAE: false,
		},
	},
	polymorphSelf: {
		icon: '<i class="fas fa-eye"></i>',
		label: `${CONSTANTS.MODULE_NAME}.polymorphSelf`,
		options: {
			keepSelf: true,
		},
	},
};
