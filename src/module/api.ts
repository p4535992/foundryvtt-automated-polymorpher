import type { TokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import { ANIMATIONS } from './animations';
import { PolymorpherData, PolymorpherFlags } from './automatedPolymorpherModels';
import CONSTANTS from './constants';
import { error, info, wait, warn } from './lib/lib';
import { PolymorpherManager } from './polymorphermanager';

const API = {
  async invokePolymorpherManagerArr(...inAttributes: any[]) {
    if (!Array.isArray(inAttributes)) {
      throw error('invokePolymorpherManager | inAttributes must be of type array');
    }
    const [sourceToken, removePolymorpher, ordered, random, animationExternal] = inAttributes;
    const result = await (this as typeof API).invokePolymorpherManager(
      sourceToken,
      removePolymorpher,
      ordered,
      random,
      animationExternal,
    );
    return result;
  },

  async invokePolymorpherManager(
    sourceTokenId: string,
    removePolymorpher = false,
    ordered = false,
    random = false,
    animationExternal: { sequence: undefined; timeToWait: 0 } | undefined = undefined,
  ): Promise<void> {
    const sourceToken = canvas.tokens?.placeables.find((t: Token) => {
      return t.id === sourceTokenId;
    });
    if (!sourceToken) {
      warn(`No token founded on canvas with id '${sourceTokenId}'`, true);
      return;
    }
    const actor = <Actor>sourceToken.actor;
    if (!actor) {
      warn(`No actor founded on canvas with token '${sourceTokenId}'`, true);
      return;
    }
    const listPolymorphers: PolymorpherData[] =
      // actor &&
      // (<boolean>actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_LOCAL) ||
      //   game.settings.get(CONSTANTS.MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR))
      //   ? <PolymorpherData[]>actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || []
      //   : <PolymorpherData[]>game.user?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];
      <PolymorpherData[]>actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];

    let isOrdered = ordered;
    let isRandom = random;

    if (!ordered && actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED)) {
      isOrdered = <boolean>actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED) ?? false;
    }
    if (!random && actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM)) {
      isRandom = <boolean>actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM) ?? false;
    }

    // TODO find a better method than this
    let lastElement = '';
    let specialCaseEndWith1 = false;
    if (sourceToken.name.endsWith(')')) {
      specialCaseEndWith1 = true;
    }
    const matches = <any[]>sourceToken.name.match(/(?<=\().+?(?=\))/g);
    if (matches && matches.length > 0) {
      lastElement = matches[matches.length - 1];
    } else {
      lastElement = sourceToken.name;
    }
    if (specialCaseEndWith1) {
      lastElement = lastElement + ')';
    }

    let tokenData = <TokenData>await actor.getTokenData();
    let tokenFromTransform = <Token>canvas.tokens?.placeables.find((t: Token) => {
        return t.actor?.id === actor.id;
      }) || undefined;

    if (removePolymorpher) {
      const updatesForRevert: any = sourceToken.actor?.getFlag(
        CONSTANTS.MODULE_NAME,
        PolymorpherFlags.UPDATES_FOR_REVERT,
      );
      if (!updatesForRevert) {
        await sourceToken.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
        await sourceToken.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.UPDATES_FOR_REVERT);
        warn(`Can't revert this token without the flag '${PolymorpherFlags.UPDATES_FOR_REVERT}'`, true);
        return;
      }
      const arrayMutationNames: string[] = <string[]>(
        actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT)
      );
      await sourceToken.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
      await sourceToken.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.UPDATES_FOR_REVERT);

      const polyData = listPolymorphers.find((a) => {
        return lastElement.toLowerCase().includes(a.name.toLowerCase());
      });
      const polyDataIndex = listPolymorphers.findIndex((a) => {
        return lastElement.toLowerCase().includes(a.name.toLowerCase());
      });

      const animation = polyData?.animation;
      tokenData = updatesForRevert.tokenData || tokenData;
      tokenFromTransform = <Token>canvas.tokens?.placeables.find((t: Token) => {
          return t.id === tokenData._id;
        }) || tokenData;

      if (animationExternal && animationExternal.sequence) {
        //@ts-ignore
        await animationExternal.sequence.play();
        await wait(animationExternal.timeToWait);
      } else if (animation) {
        if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
          //@ts-ignore
          game.macros?.getName(ANIMATIONS.animationFunctions[animation].fn)?.execute(tokenFromTransform, tokenData);
        } else {
          ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenData);
        }
        await wait(ANIMATIONS.animationFunctions[animation].time);
      }

      // Do something with left click
      if (game.system.id === 'dnd5e') {
        //@ts-ignore
        actor?.revertOriginalForm();
      } else {
        for (const revertName of arrayMutationNames) {
          info(`Revert token ${sourceToken.name}`);
          //@ts-ignore
          await warpgate.revert(sourceToken.document, revertName);
        }
        /*
        const tokenDataToTransform = updatesForRevert.tokenData;
        const actorDataToTransform = updatesForRevert.actorData;
        const updates = {
          token: {
            name: tokenDataToTransform.name,
            img: tokenDataToTransform.img,
            scale: tokenDataToTransform.scale,
            data: tokenDataToTransform,
          },
          actor: {
            data: actorDataToTransform,
          },
        };

        //@ts-ignore
        await warpgate.mutate(sourceToken.document, updates, {}, {});
        */
      }
    } else {
      if (isRandom && isOrdered) {
        warn(`Attention you can't enable the 'ordered' and the 'random' both at the same time`);
        return;
      }
      if (isRandom) {
        if (listPolymorphers?.length === 1) {
          new PolymorpherManager(actor, sourceToken).fastSummonPolymorpher(
            <PolymorpherData>listPolymorphers[0],
            animationExternal,
          );
        } else {
          const polyDataIndex = listPolymorphers.findIndex((a) => {
            return lastElement.toLowerCase().includes(a.name.toLowerCase());
          });
          let randomIndex = 0;
          while (randomIndex === polyDataIndex) {
            randomIndex = Math.floor(Math.random() * listPolymorphers.length);
          }
          new PolymorpherManager(actor, sourceToken).fastSummonPolymorpher(
            <PolymorpherData>listPolymorphers[randomIndex],
            animationExternal,
          );
        }
      } else if (isOrdered) {
        const polyDataIndex = listPolymorphers.findIndex((a) => {
          return lastElement.toLowerCase().includes(a.name.toLowerCase());
        });
        const nextIndex = polyDataIndex + 1;
        if (listPolymorphers?.length - 1 < nextIndex) {
          new PolymorpherManager(actor, sourceToken).fastSummonPolymorpher(
            <PolymorpherData>listPolymorphers[0],
            animationExternal,
          );
        } else {
          new PolymorpherManager(actor, sourceToken).fastSummonPolymorpher(
            <PolymorpherData>listPolymorphers[nextIndex],
            animationExternal,
          );
        }
      } else {
        new PolymorpherManager(actor, sourceToken).render(true);
      }
    }
  },

  async cleanUpTokenSelected() {
    const tokens = <Token[]>canvas.tokens?.controlled;
    if (!tokens || tokens.length === 0) {
      warn(`No tokens are selected`, true);
      return;
    }
    for (const token of tokens) {
      if (token && token.document) {
        if (getProperty(token.document, `data.flags.${CONSTANTS.MODULE_NAME}`)) {
          const p = getProperty(token.document, `data.flags.${CONSTANTS.MODULE_NAME}`);
          for (const key in p) {
            const senseOrConditionIdKey = key;
            const senseOrConditionValue = <any>p[key];
            await token.document.unsetFlag(CONSTANTS.MODULE_NAME, senseOrConditionIdKey);
          }
          info(`Cleaned up token '${token.name}'`, true);
        }
      } else {
        warn(`No token found on the canvas for id '${token.id}'`, true);
      }
    }
    for (const token of tokens) {
      if (token && token.actor) {
        if (getProperty(token.actor, `data.flags.${CONSTANTS.MODULE_NAME}`)) {
          const p = getProperty(token.actor, `data.flags.${CONSTANTS.MODULE_NAME}`);
          for (const key in p) {
            const senseOrConditionIdKey = key;
            const senseOrConditionValue = <any>p[key];
            await token.actor.unsetFlag(CONSTANTS.MODULE_NAME, senseOrConditionIdKey);
          }
          info(`Cleaned up actor '${token.name}'`, true);
        }
      } else {
        warn(`No token found on the canvas for id '${token.id}'`, true);
      }
    }
  },
};

export default API;
