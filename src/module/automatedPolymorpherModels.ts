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
