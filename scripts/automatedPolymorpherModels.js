import CONSTANTS from "./constants.js";
export class SystemCreatures {
}
// export class Creatures {
//   [key: string]: Creature[]|FunctionCreature;
// }
export class Creature {
}
export class TokenRevertData {
}
// export class CreatureData{
//   animation:string;
//   level:number;
// }
// const createCreature = function(data:CreatureData):Creature[]{
//   return [];
// }
// type FunctionCreature = ReturnType<typeof createCreature>
export var PolymorpherFlags;
(function (PolymorpherFlags) {
    // IS_LOCAL = 'isLocal',
    // STORE_ON_ACTOR = 'storeonactor',
    PolymorpherFlags["POLYMORPHERS"] = "polymorphers";
    PolymorpherFlags["RANDOM"] = "random";
    PolymorpherFlags["ORDERED"] = "ordered";
    PolymorpherFlags["COMPENDIUM"] = "compendium";
    // UPDATES_FOR_REVERT = 'updatesforrevert',
    PolymorpherFlags["MUTATION_NAMES_FOR_REVERT"] = "mutationNamesForRevert";
    PolymorpherFlags["TRANSFORMER_OPTIONS"] = "transformOptions";
    // ORIGINAL FLAG DND5E
    PolymorpherFlags["IS_POLYMORPHED"] = "isPolymorphed";
    PolymorpherFlags["ORIGINAL_ACTOR"] = "originalActor";
    PolymorpherFlags["PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR"] = "previousOriginalActor";
    // NEW_CREATED_ACTOR_TO_DELETE = 'newCreatedActorToDelete',
})(PolymorpherFlags || (PolymorpherFlags = {}));
export class PolymorpherData {
}
export class PolymorpherCompendiumData {
}
export class TransformOptionsGeneric {
    constructor() {
        this.keepPhysical = false;
        this.keepMental = false;
        this.keepSaves = false;
        this.keepSkills = false;
        this.mergeSaves = false;
        this.mergeSkills = false;
        this.keepClass = false;
        this.keepFeats = false;
        this.keepSpells = false;
        this.keepItems = false;
        this.keepBio = false;
        this.keepVision = false;
        this.keepSelf = false;
        this.keepAE = false;
        // removeAE = false;
        // keepAEOnlyOriginNotEquipment = false;
        this.keepOtherOriginAE = true;
        this.keepOriginAE = true;
        this.keepEquipmentAE = true;
        this.keepFeatAE = true;
        this.keepSpellAE = true;
        this.keepClassAE = true;
        this.keepBackgroundAE = true;
        //
        this.transformTokens = true;
        this.explicitName = "";
    }
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
