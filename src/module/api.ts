import { TokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import { ANIMATIONS } from './animations';
import { PolymorpherData, PolymorpherFlags } from './automatedPolymorpherModels';
import CONSTANTS from './constants';
import { error, wait } from './lib/lib';
import { PolymorpherManager } from './polymorphermanager';
import { canvas, game } from './settings';

const API = {
  async invokePolymorpherManagerArr(...inAttributes: any[]) {
    if (!Array.isArray(inAttributes)) {
      throw error('invokePolymorpherManager | inAttributes must be of type array');
    }
    const [sourceToken, removePolymorpher, random] = inAttributes;
    const result = await this.invokePolymorpherManager(sourceToken, removePolymorpher, random);
    return result;
  },

  async invokePolymorpherManager(sourceToken: Token, removePolymorpher, random = false) {
    const actor = <Actor>sourceToken.document.actor;

    const listPolymorphers: PolymorpherData[] =
    sourceToken.actor &&
    (<boolean>sourceToken.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_LOCAL) ||
      game.settings.get(CONSTANTS.MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR))
      ? <PolymorpherData[]>sourceToken.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || []
      : <PolymorpherData[]>game.user?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];

    if (removePolymorpher) {
      const matches = <any[]>sourceToken.name.match(/(?<=\().+?(?=\))/g);
      const lastElement = matches[matches.length - 1];
      const animation = listPolymorphers.find((a) =>{
        return lastElement.toLowerCase().includes(a.name.toLowerCase()); 
      })?.animation;

      const tokenData = <TokenData>await actor.getTokenData();
      const posData = <Token>canvas.tokens?.placeables.find((t: Token) => {
          return t.actor?.id === actor.id;
        }) || undefined;

      if(animation){
        if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
          //@ts-ignore
          game.macros?.getName(ANIMATIONS.animationFunctions[animation].fn)?.execute(posData, tokenData);
        } else {
          ANIMATIONS.animationFunctions[animation].fn(posData, tokenData);
        }
        await wait(ANIMATIONS.animationFunctions[animation].time);
      }

      // Do something with left click
      if (game.system.id === 'dnd5e') {
        //@ts-ignore
        actor?.revertOriginalForm();
      } else {
        //@ts-ignore
        warpgate.revert(sourceToken.document, (mutationName = actor.id));
      }
    } else {
      if (random) {
        if (listPolymorphers?.length === 1) {
          new PolymorpherManager(actor).fastSummonPolymorpher(listPolymorphers[0]);
        } else {
          const randomIndex = Math.floor(Math.random() * listPolymorphers.length);
          new PolymorpherManager(actor).fastSummonPolymorpher(listPolymorphers[randomIndex]);
        }
      } else {
        new PolymorpherManager(actor).render(true);
      }
    }
  },
};

export default API;
