import { PolymorpherData, PolymorpherFlags } from './automatedPolymorpherModels';
import CONSTANTS from './constants';
import { error } from './lib/lib';
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
    if (removePolymorpher) {
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
        const listPolymorphers: PolymorpherData[] =
          this.actor &&
          (<boolean>this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_LOCAL) ||
            game.settings.get(CONSTANTS.MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR))
            ? <PolymorpherData[]>this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || []
            : <PolymorpherData[]>game.user?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];

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
