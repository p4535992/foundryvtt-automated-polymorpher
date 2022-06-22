import type {
  ActorData,
  PrototypeTokenData,
  TokenData,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { ANIMATIONS } from '../animations';
import type { TransformOptions } from '../automatedPolymorpherModels';
import CONSTANTS from '../constants';
import { i18n, info, wait, warn } from '../lib/lib';

export default {
  /**
   * Options that determine what properties of the original actor are kept and which are replaced with
   * the target actor.
   *
   * @typedef {object} TransformationOptions
   * @property {boolean} [keepVision=false]      Keep vision
   * @property {boolean} [keepSelf=false]        Keep self
   * @property {boolean} [removeAE=false]        Remove active effects
   * @property {boolean} [keepAEOnlyOriginNotEquipment=false] Keep only active effects which origin is not equipment
   * @property {boolean} [transformTokens=true]  Transform linked tokens too
   */
  polymorphSettings: {
    keepVision: true,
    keepSelf: false,
    removeAE: false,
    keepAEOnlyOriginNotEquipment: false,
    transformTokens: true,
  },

  /**
   * Settings to configure how actors are merged when polymorphing is applied.
   * @enum {string}
   */
  i18nPolymorphSettings: {
    keepVision: 'DND5E.PolymorphKeepVision',
    keepSelf: 'DND5E.PolymorphKeepSelf',
    removeAE: 'DND5E.PolymorphRemoveAE',
    keepAEOnlyOriginNotEquipment: 'DND5E.PolymorphKeepAEOnlyOriginNotEquipment',
  },

  /**
   * Options that determine what properties of the original actor are kept and which are replaced with
   * the target actor.
   *
   * @typedef {object} TransformationOptions
   * @property {boolean} [keepPhysical=false]    Keep physical abilities (str, dex, con)
   * @property {boolean} [keepMental=false]      Keep mental abilities (int, wis, cha)
   * @property {boolean} [keepSaves=false]       Keep saving throw proficiencies
   * @property {boolean} [keepSkills=false]      Keep skill proficiencies
   * @property {boolean} [mergeSaves=false]      Take the maximum of the save proficiencies
   * @property {boolean} [mergeSkills=false]     Take the maximum of the skill proficiencies
   * @property {boolean} [keepClass=false]       Keep proficiency bonus
   * @property {boolean} [keepFeats=false]       Keep features
   * @property {boolean} [keepSpells=false]      Keep spells
   * @property {boolean} [keepItems=false]       Keep items
   * @property {boolean} [keepBio=false]         Keep biography
   * @property {boolean} [keepVision=false]      Keep vision
   * @property {boolean} [keepSelf=false]        Keep self
   * @property {boolean} [removeAE=false]        Remove active effects
   * @property {boolean} [keepAEOnlyOriginNotEquipment=false] Keep only active effects which origin is not equipment
   * @property {boolean} [transformTokens=true]  Transform linked tokens too
   * @property {boolean} [renderSheet=true]  Render the sheet of the transformed actor after the polymorph
   */

  /**
   * Transform this Actor into another one.
   *
   * @param {Actor} actorThis                 The original actor before transformation.
   * @param {Actor} target                      The target Actor.
   * @param {TransformationOptions} [options={}]  Options that determine how the transformation is performed.
   * @returns {Promise<Array<Token>>|null}        Updated token if the transformation was performed.
   */
  async transformInto(
    actorThis: Actor,
    target: Actor,
    transformOptions: TransformOptions | undefined = undefined,
    renderSheet = true,
  ) {
    const keepVision = transformOptions?.keepVision || false;
    const keepSelf = transformOptions?.keepSelf || false;
    const removeAE = transformOptions?.removeAE || false;
    const keepAEOnlyOriginNotEquipment = transformOptions?.keepAEOnlyOriginNotEquipment || false;
    const transformTokens = transformOptions?.transformTokens || true;

    // TODO
    return new Object();
  },

  /* -------------------------------------------- */

  /**
   * If this actor was transformed with transformTokens enabled, then its
   * active tokens need to be returned to their original state. If not, then
   * we can safely just delete this actor.
   * @param {boolean} [renderSheet] Render Sheet after revert the transformation.
   * @returns {Promise<Actor>|null}  Original actor if it was reverted.
   */
  async revertOriginalForm(actorThis: Actor, renderSheet = true) {
    // TODO
    return new Object();
  },

  async renderDialogTransformOptions(actorFromTransform: Actor, actorToTransform: Actor, animation: string) {
    const tokenDataToTransform = <TokenData>await actorToTransform.getTokenData();
    const tokenFromTransform = <Token>canvas.tokens?.placeables.find((t: Token) => {
        return t.actor?.id === actorFromTransform.id;
      }) || undefined;
    // Define a function to record polymorph settings for future use
    const rememberOptions = (html) => {
      const options = {};
      html.find('input').each((i, el) => {
        options[el.name] = el.checked;
      });
      const settings = mergeObject(this.transformOptions || {}, options);
      //game.settings.set('dnd5e', 'polymorphSettings', settings);
      return settings;
    };

    // Create and render the Dialog
    return new Dialog(
      {
        title: i18n('DND5E.PolymorphPromptTitle'),
        //@ts-ignore
        content: {
          options: this.polymorphSetting,
          i18n: this.i18nPolymorphSettings,
          isToken: actorFromTransform.isToken,
        },
        default: 'accept',
        buttons: {
          accept: {
            icon: '<i class="fas fa-check"></i>',
            label: i18n('DND5E.PolymorphAcceptSettings'),
            callback: async (html) => {
              if (tokenFromTransform) {
                if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                  game.macros
                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                    //@ts-ignore
                    ?.execute(tokenFromTransform, tokenDataToTransform);
                } else {
                  ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
                }
                await wait(ANIMATIONS.animationFunctions[animation].time);
              }
              info(`${actorFromTransform.name} turns into a ${actorToTransform.name}`);
              // TODO show on chat ?
              //await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
              await this.transformInto(actorFromTransform, actorToTransform, rememberOptions(html), false);
              // if (game.settings.get(CONSTANTS.MODULE_NAME, 'autoclose')) {
              //   this.close();
              // } else {
              //   this.maximize();
              // }
            },
          },
          wildshape: {
            icon: '<i class="fas fa-paw"></i>',
            label: i18n('DND5E.PolymorphWildShape'),
            callback: async (html) => {
              if (tokenFromTransform) {
                if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                  game.macros
                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                    //@ts-ignore
                    ?.execute(tokenFromTransform, tokenDataToTransform);
                } else {
                  ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
                }
                await wait(ANIMATIONS.animationFunctions[animation].time);
              }
              info(`${actorFromTransform.name} turns into a ${actorToTransform.name}`);
              // TODO show on chat ?
              //await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
              //@ts-ignore
              await this.transformInto(
                actorFromTransform,
                actorToTransform,
                {
                  keepBio: true,
                  keepClass: true,
                  keepMental: true,
                  mergeSaves: true,
                  mergeSkills: true,
                  transformTokens: rememberOptions(html).transformTokens,
                },
                false,
              );
              // if (game.settings.get(CONSTANTS.MODULE_NAME, 'autoclose')) {
              //   this.close();
              // } else {
              //   this.maximize();
              // }
            },
          },
          polymorph: {
            icon: '<i class="fas fa-pastafarianism"></i>',
            label: i18n('DND5E.Polymorph'),
            callback: async (html) => {
              if (tokenFromTransform) {
                if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                  game.macros
                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                    //@ts-ignore
                    ?.execute(tokenFromTransform, tokenDataToTransform);
                } else {
                  ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
                }
                await wait(ANIMATIONS.animationFunctions[animation].time);
              }
              info(`${actorFromTransform.name} turns into a ${actorToTransform.name}`);
              // TODO show on chat ?
              //await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
              //@ts-ignore
              await this.transformInto(
                actorFromTransform,
                actorToTransform,
                {
                  transformTokens: rememberOptions(html).transformTokens,
                },
                false,
              );
              // if (game.settings.get(CONSTANTS.MODULE_NAME, 'autoclose')) {
              //   this.close();
              // } else {
              //   this.maximize();
              // }
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: i18n('Cancel'),
          },
        },
      },
      {
        classes: ['dialog', 'dnd5e'],
        width: 600,
        template: `modules/${CONSTANTS.MODULE_NAME}/templates/polymorph-prompt.hbs`,
      },
      // ).render(true);
    );
  },
};
