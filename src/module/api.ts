import type { TokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import { ANIMATIONS } from './animations';
import {
  PolymorpherData,
  PolymorpherFlags,
  TransformOptions,
  TransformOptionsDnd5e,
} from './automatedPolymorpherModels';
import CONSTANTS from './constants';
import { error, info, retrieveActorFromToken, wait, warn } from './lib/lib';
import { PolymorpherManager } from './polymorphermanager';
import dnd5e from './systems/dnd5e';
import generic from './systems/generic';

const API = {
  async invokePolymorpherManagerArr(...inAttributes: any[]) {
    if (!Array.isArray(inAttributes)) {
      throw error('invokePolymorpherManager | inAttributes must be of type array');
    }
    const [sourceTokenIdOrName, removePolymorpher, ordered, random, animationExternal] = inAttributes;
    const result = await (this as typeof API).invokePolymorpherManager(
      sourceTokenIdOrName,
      removePolymorpher,
      ordered,
      random,
      animationExternal,
    );
    return result;
  },

  async invokePolymorpherManagerFromActorArr(...inAttributes: any[]) {
    if (!Array.isArray(inAttributes)) {
      throw error('invokePolymorpherManagerFromActor | inAttributes must be of type array');
    }
    const [sourceActorIdOrName, removePolymorpher, ordered, random, animationExternal] = inAttributes;
    const result = await (this as typeof API).invokePolymorpherManagerFromActor(
      sourceActorIdOrName,
      removePolymorpher,
      ordered,
      random,
      animationExternal,
    );
    return result;
  },

  async invokePolymorpherManagerFromActor(
    sourceActorIdOrName: string,
    removePolymorpher = false,
    ordered = false,
    random = false,
    animationExternal: { sequence: undefined; timeToWait: 0 } | undefined = undefined,
  ): Promise<void> {
    for (const tokenOnCanvas of <Token[]>canvas.tokens?.placeables) {
      const actor = retrieveActorFromToken(tokenOnCanvas);
      if (actor && (actor.id === sourceActorIdOrName || actor.name === sourceActorIdOrName)) {
        this._invokePolymorpherManagerInner(
          actor,
          tokenOnCanvas,
          removePolymorpher,
          ordered,
          random,
          animationExternal,
        );
        break;
      }
    }
  },

  async invokePolymorpherManager(
    sourceTokenIdOrName: string,
    removePolymorpher = false,
    ordered = false,
    random = false,
    animationExternal: { sequence: undefined; timeToWait: 0 } | undefined = undefined,
  ): Promise<void> {
    const sourceToken = canvas.tokens?.placeables.find((t) => {
      return t.id === sourceTokenIdOrName || t.name === sourceTokenIdOrName;
    });
    if (!sourceToken) {
      warn(`No token founded on canvas with id/name '${sourceTokenIdOrName}'`, true);
      return;
    }
    const actor = retrieveActorFromToken(sourceToken);
    if (!actor) {
      warn(`No actor founded for the token with id/name '${sourceTokenIdOrName}'`, true);
      return;
    }
    this._invokePolymorpherManagerInner(actor, sourceToken, removePolymorpher, ordered, random, animationExternal);
  },

  async _invokePolymorpherManagerInner(
    actor: Actor,
    sourceToken: Token,
    removePolymorpher = false,
    ordered = false,
    random = false,
    animationExternal: { sequence: undefined; timeToWait: 0 } | undefined = undefined,
  ): Promise<void> {
    // const sourceToken = canvas.tokens?.placeables.find((t) => {
    //   return t.id === sourceTokenIdOrName || t.name === sourceTokenIdOrName;
    // });
    // if (!sourceToken) {
    //   // warn(`No token founded on canvas with id/name '${sourceTokenIdOrName}'`, true);
    //   return;
    // }
    // const actor = retrieveActorFromToken(sourceToken);
    // if (!actor) {
    //   // warn(`No actor founded for the token with id/name '${sourceTokenIdOrName}'`, true);
    //   return;
    // }
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

    let tokenDataToTransform = <TokenData>await actor.getTokenData();
    let tokenFromTransform = <Token>canvas.tokens?.placeables.find((t: Token) => {
        return t.actor?.id === actor.id;
      }) || undefined;

    if (removePolymorpher) {
      const updatesForRevert = <TokenData>actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
      if (!updatesForRevert) {
        await actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
        await actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
        warn(`Can't revert this token without the flag '${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}'`, true);
        return;
      }
      /*
      const updatesForRevert: any = actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.UPDATES_FOR_REVERT);
      if (!updatesForRevert) {
        await actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
        await actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.UPDATES_FOR_REVERT);
        warn(`Can't revert this token without the flag '${PolymorpherFlags.UPDATES_FOR_REVERT}'`, true);
        return;
      }
      */
      let arrayMutationNames: string[] = <string[]>(
        actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT)
      );
      if (!arrayMutationNames || arrayMutationNames.length == 0) {
        arrayMutationNames = [];
        warn(`Array mutation names for the revert is null or empty`);
      }
      await actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
      // await actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.UPDATES_FOR_REVERT);
      await actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);

      const polyData = listPolymorphers.find((a) => {
        return lastElement.toLowerCase().includes(a.name.toLowerCase());
      });
      const polyDataIndex = listPolymorphers.findIndex((a) => {
        return lastElement.toLowerCase().includes(a.name.toLowerCase());
      });

      const animation = polyData?.animation;
      //tokenDataToTransform = updatesForRevert.tokenData || tokenDataToTransform;
      tokenDataToTransform = updatesForRevert || tokenDataToTransform;
      tokenFromTransform = <Token>canvas.tokens?.placeables.find((t: Token) => {
          return t.id === tokenDataToTransform._id;
        }) || tokenDataToTransform;

      if (animationExternal && animationExternal.sequence) {
        //@ts-ignore
        await animationExternal.sequence.play();
        await wait(animationExternal.timeToWait);
      } else if (animation) {
        if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
          //@ts-ignore
          game.macros
            ?.getName(ANIMATIONS.animationFunctions[animation].fn)
            //@ts-ignore
            ?.execute({ tokenFromTransform, tokenDataToTransform });
        } else {
          ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
        }
        await wait(ANIMATIONS.animationFunctions[animation].time);
      }

      // Do something with left click
      if (!game.settings.get(CONSTANTS.MODULE_NAME, 'forceUseOfWarpgate')) {
        info(`${actor.name} reverts to their original form`);
        // TODO show on chat ?
        //await ChatMessage.create({content: `${actor.name} reverts to their original form`, speaker:{alias: actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
        //actor?.revertOriginalForm();
        API.revertOriginalForm(actor, false);
      } else {
        if (arrayMutationNames.length > 0) {
          for (const revertName of arrayMutationNames) {
            info(`${actor.name} reverts to their original form`);
            // TODO show on chat ?
            //await ChatMessage.create({content: `${actor.name} reverts to their original form`, speaker:{alias: actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
            //@ts-ignore
            await warpgate.revert(sourceToken.document, revertName);
          }
        } else {
          //@ts-ignore
          await warpgate.revert(sourceToken.document, '');
        }
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

  get polymorphSetting(): TransformOptions | TransformOptionsDnd5e {
    return <TransformOptions | TransformOptionsDnd5e>game.settings.get(CONSTANTS.MODULE_NAME, 'polymorphSetting');
  },

  async transformInto(
    actorFromTransform: Actor,
    actorToTransform: Actor,
    transformOptions: TransformOptions | TransformOptionsDnd5e,
    renderSheet: boolean,
  ): Promise<any> {
    if (game.system.id === 'dnd5e') {
      return dnd5e.transformInto(actorFromTransform, actorToTransform, <TransformOptionsDnd5e>transformOptions, renderSheet);
    } else {
      return generic.transformInto(actorFromTransform, actorToTransform, transformOptions, renderSheet);
    }
  },

  /**
   * If this actor was transformed with transformTokens enabled, then its
   * active tokens need to be returned to their original state. If not, then
   * we can safely just delete this actor.
   * @param {boolean} [renderSheet] Render Sheet after revert the transformation.
   * @returns {Promise<Actor>|null}  Original actor if it was reverted.
   */
  async revertOriginalForm(actorThis: Actor, renderSheet: boolean) {
    if (game.system.id === 'dnd5e') {
      return dnd5e.revertOriginalForm(actorThis, renderSheet);
    } else {
      return generic.revertOriginalForm(actorThis, renderSheet);
    }
  },

  async renderDialogTransformOptions(
    tokenFromTransform: Token,
    actorFromTransform: Actor,
    actorToTransform: Actor,
    animation: string,
  ): Promise<Dialog<DialogOptions>> {
    if (game.system.id === 'dnd5e') {
      return dnd5e.renderDialogTransformOptions(actorFromTransform, actorToTransform, animation);
    } else {
      return generic.renderDialogTransformOptions(actorFromTransform, actorToTransform, animation);
    }
  },
};

export default API;
