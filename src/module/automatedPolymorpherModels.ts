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
  STORE_ON_ACTOR = 'storeonactor',
  POLYMORPHERS = 'polymorphers',
  RANDOM = 'random',
  ORDERED = 'ordered',
  COMPENDIUM = 'compendium',
  // UPDATES_FOR_REVERT = 'updatesforrevert',
  MUTATION_NAMES_FOR_REVERT = 'mutationNamesForRevert',
  TRANSFORMER_OPTIONS = 'transformOptions',
  // ORIGINAL FLAG DND5E
  IS_POLYMORPHED = 'isPolymorphed',
  ORIGINAL_ACTOR = 'originalActor',
  PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR = 'previousOriginalActor',
  // NEW_CREATED_ACTOR_TO_DELETE = 'newCreatedActorToDelete',
}

export class PolymorpherData {
  id: string;
  name: string;
  animation: string;
  number: number;
  defaultsummontype: string;
  compendiumid: string;
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
  removeAE = false;
  keepAEOnlyOriginNotEquipment = false;
  transformTokens = true;
}
