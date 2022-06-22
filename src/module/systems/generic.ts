import type {
  ActorData,
  PrototypeTokenData,
  TokenData,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { ANIMATIONS } from '../animations';
import { PolymorpherData, PolymorpherFlags, TransformOptions } from '../automatedPolymorpherModels';
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

    // Get the original Actor data and the new source data
    const o = <any>actorThis.toJSON();
    if (getProperty(o.flags, `${CONSTANTS.MODULE_NAME}`)) {
      setProperty(o.flags, `${CONSTANTS.MODULE_NAME}`, {});
    }

    const source = <any>target.toJSON();

    let d = <any>new Object();
    if (keepSelf) {
      // Keep Self
      mergeObject(d, o);
    }

    // Prepare new data to merge from the source
    d = {
      type: o.type, // Remain the same actor type
      name: `${o.name} (${source.name})`, // Append the new shape to your old name
      data: source.data, // Get the data model of your new form
      items: source.items, // Get the items of your new form
      effects: o.effects.concat(source.effects), // Combine active effects from both forms
      img: source.img, // New appearance
      permission: o.permission, // Use the original actor permissions
      folder: o.folder, // Be displayed in the same sidebar folder
      flags: o.flags, // Use the original actor flags
    };

    // Specifically delete some data attributes
    //@ts-ignore
    delete d.data.resources; // Don't change your resource pools
    //@ts-ignore
    delete d.data.currency; // Don't lose currency
    //@ts-ignore
    delete d.data.bonuses; // Don't lose global bonuses

    // Specific additional adjustments
    //@ts-ignore
    d.data.details.alignment = o.data.details.alignment; // Don't change alignment
    //@ts-ignore
    d.data.attributes.exhaustion = o.data.attributes.exhaustion; // Keep your prior exhaustion level
    //@ts-ignore
    d.data.attributes.inspiration = o.data.attributes.inspiration; // Keep inspiration
    //@ts-ignore
    d.data.spells = o.data.spells; // Keep spell slots
    //@ts-ignore
    d.data.attributes.ac.flat = target.data.data.attributes.ac.value; // Override AC

    // Token appearance updates
    d.token = <PrototypeTokenData>{ name: d.name };
    for (const k of ['width', 'height', 'scale', 'img', 'mirrorX', 'mirrorY', 'tint', 'alpha', 'lockRotation']) {
      d.token[k] = source.token[k];
    }

    if (source.token.randomImg) {
      const images = await target.getTokenImages();
      d.token.img = <string>images[Math.floor(Math.random() * images.length)];
    }

    if (!keepSelf) {
      const vision = keepVision ? o.token : source.token;
      for (const k of ['dimSight', 'brightSight', 'dimLight', 'brightLight', 'vision', 'sightAngle']) {
        d.token[k] = vision[k];
      }

      // Keep senses
      if (keepVision) d.data.traits.senses = o.data.traits.senses;

      // Not keep active effects
      if (removeAE && !keepAEOnlyOriginNotEquipment) d.effects = [];

      // Keep active effects only origin not equipment
      if (keepAEOnlyOriginNotEquipment) {
        const tokenEffects = foundry.utils.deepClone(d.effects) || [];
        const notEquipItems = ['feat', 'spell', 'class', 'subclass'];
        const tokenEffectsNotEquipment: any[] = [];
        for (const effect of tokenEffects) {
          if (!effect.origin.toLowerCase().startsWith('item')) {
            tokenEffectsNotEquipment.push(effect);
          }
        }
        d.effects = tokenEffectsNotEquipment;
      }
    }

    // Set new data flags
    if (
      !actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED) ||
      !getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
    ) {
      setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, actorThis.id);
    }
    setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
    setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}`, actorThis.getTokenData());

    const dd = <PolymorpherData[]>actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];
    setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.POLYMORPHERS}`, dd);
    // Update unlinked Tokens in place since they can simply be re-dropped from the base actor
    if (actorThis.isToken) {
      const tokenData = d.token;
      // tokenData.actorData = d;
      setProperty(tokenData, `actorData`, d);
      //@ts-ignore
      delete tokenData.actorData.token;
      return actorThis.token?.update(tokenData);
    }

    // Close sheet for non-transformed Actor
    await actorThis.sheet?.close();

    /**
     * A hook event that fires just before the actor is transformed.
     * @function dnd5e.transformActor
     * @memberof hookEvents
     * @param {Actor} actorThis                 The original actor before transformation.
     * @param {Actor} target                 The target actor into which to transform.
     * @param {object} data                    The data that will be used to create the new transformed actor.
     * @param {TransformationOptions} options  Options that determine how the transformation is performed.
     */
    Hooks.callAll(`${CONSTANTS.MODULE_NAME}.transformActor`, actorThis, target, d, transformOptions, renderSheet);

    // Some info like height and weight of the token are reset to default
    // after the constructor of the actor is invoked solved with a backup of the info of the token
    const tokenBackup = duplicate(d.token);
    // Create new Actor with transformed data
    //@ts-ignore
    const newActor = await actorThis.constructor.create(d, { renderSheet: renderSheet });
    mergeObject(d.token, tokenBackup);

    // Update placed Token instances
    if (!transformTokens) return;
    const tokens = actorThis.getActiveTokens(true);
    const updates = tokens.map((t) => {
      const newTokenData = foundry.utils.deepClone(d.token);
      newTokenData._id = t.data._id;
      //@ts-ignore
      newTokenData.actorId = <string>newActor.id;
      newTokenData.actorLink = true;
      return newTokenData;
    });
    //@ts-ignore
    return canvas.scene?.updateEmbeddedDocuments('Token', updates);
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
    if (!actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED)) return;
    if (!actorThis.isOwner) {
      return warn(game.i18n.localize('DND5E.PolymorphRevertWarn'), true);
    }

    /**
     * A hook event that fires just before the actor is reverted to original form.
     * @function dnd5e.transformActor
     * @memberof hookEvents
     * @param {Actor} actorThis                 The original actor before transformation.
     * @param {boolean} renderSheet             Render Sheet after revert the transformation.
     */
    Hooks.callAll(`${CONSTANTS.MODULE_NAME}.revertOriginalForm`, actorThis, renderSheet);

    const previousOriginalActorTokenData = <TokenData>(
      actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
    );
    let isTheOriginalActor = false;
    if (!previousOriginalActorTokenData) {
      isTheOriginalActor = true;
    }

    // If we are reverting an unlinked token, simply replace it with the base actor prototype
    if (actorThis.isToken) {
      // Obtain a reference to the base actor prototype
      let baseActor = <Actor>game.actors?.get(<string>actorThis.token?.data.actorId);
      if (!baseActor) {
        baseActor = <Actor>game.actors?.get(<string>actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR));
      }
      if (!baseActor) {
        if (!previousOriginalActorTokenData) {
          warn(
            game.i18n.format('DND5E.PolymorphRevertNoOriginalActorWarn', {
              reference: <string>actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR),
            }),
            true,
          );
          return;
        }
      }
      const prototypeTokenData = previousOriginalActorTokenData
        ? previousOriginalActorTokenData
        : await baseActor.getTokenData();
      const tokenUpdate = { actorData: {} };
      for (const k of [
        'width',
        'height',
        'scale',
        'img',
        'mirrorX',
        'mirrorY',
        'tint',
        'alpha',
        'lockRotation',
        'name',
      ]) {
        tokenUpdate[k] = prototypeTokenData[k];
      }
      await actorThis.token?.update(tokenUpdate, { recursive: false });
      await actorThis.sheet?.close();
      const actor = <Actor>actorThis.token?.getActor();

      if (isTheOriginalActor) {
        await actorThis.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
      }
      await actorThis.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);

      if (renderSheet) {
        actor.sheet?.render(true);
      }
      return actor;
    }

    // Obtain a reference to the original actor
    let original = <Actor>(
      game.actors?.get(<string>actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR))
    );
    if (!original) {
      original = <Actor>game.actors?.get(<string>actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR));
    }
    if (!original) {
      if (!previousOriginalActorTokenData) {
        warn(
          game.i18n.format('DND5E.PolymorphRevertNoOriginalActorWarn', {
            reference: <string>actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR),
          }),
          true,
        );
        return;
      }
    }
    // Get the Tokens which represent this actor
    if (canvas.ready) {
      const tokens = actorThis.getActiveTokens(true);
      const tokenData = previousOriginalActorTokenData ? previousOriginalActorTokenData : await original.getTokenData();
      const tokenUpdates = tokens.map((t) => {
        const update = duplicate(tokenData);
        update._id = t.id;
        //@ts-ignore
        delete update.x;
        //@ts-ignore
        delete update.y;
        return update;
      });
      await canvas.scene?.updateEmbeddedDocuments('Token', tokenUpdates);
    } else if (previousOriginalActorTokenData) {
      const tokenData = previousOriginalActorTokenData;
      const update = duplicate(tokenData);
      //@ts-ignore
      delete update.x;
      //@ts-ignore
      delete update.y;
      await canvas.scene?.updateEmbeddedDocuments('Token', [update]);
    }

    if (isTheOriginalActor) {
      await actorThis.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
    }
    await actorThis.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);

    // Delete the polymorphed version of the actor, if possible
    const isRendered = actorThis.sheet?.rendered;
    if (game.user?.isGM) await actorThis.delete();
    else if (isRendered) actorThis.sheet?.close();
    if (isRendered && renderSheet) {
      original.sheet?.render(isRendered);
    }
    return original;
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
