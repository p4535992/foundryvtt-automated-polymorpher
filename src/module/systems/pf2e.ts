import type {
  ActorData,
  PrototypeTokenData,
  TokenData,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { ANIMATIONS } from '../animations';
import { PolymorpherData, PolymorpherFlags, TransformOptionsGeneric } from '../automatedPolymorpherModels';
import CONSTANTS from '../constants';
import { i18n, info, wait, warn } from '../lib/lib';

export default {
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
   */
  polymorphSettings: {
    keepPhysical: false,
    keepMental: false,
    keepSaves: false,
    // keepSkills: false,
    mergeSaves: false,
    mergeSkills: false,
    keepClass: false,
    keepFeats: false,
    keepSpells: false,
    keepItems: false,
    keepBio: false,
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
    keepPhysical: `${CONSTANTS.MODULE_NAME}.polymorphKeepPhysical`,
    keepMental: `${CONSTANTS.MODULE_NAME}.polymorphKeepMental`,
    keepSaves: `${CONSTANTS.MODULE_NAME}.polymorphKeepSaves`,
    // keepSkills: `${CONSTANTS.MODULE_NAME}.polymorphKeepSkills`,
    mergeSaves: `${CONSTANTS.MODULE_NAME}.polymorphMergeSaves`,
    mergeSkills: `${CONSTANTS.MODULE_NAME}.polymorphMergeSkills`,
    keepClass: `${CONSTANTS.MODULE_NAME}.polymorphKeepClass`,
    keepFeats: `${CONSTANTS.MODULE_NAME}.polymorphKeepFeats`,
    keepSpells: `${CONSTANTS.MODULE_NAME}.polymorphKeepSpells`,
    keepItems: `${CONSTANTS.MODULE_NAME}.polymorphKeepItems`,
    keepBio: `${CONSTANTS.MODULE_NAME}.polymorphKeepBio`,
    keepVision: `${CONSTANTS.MODULE_NAME}.polymorphKeepVision`,
    keepSelf: `${CONSTANTS.MODULE_NAME}.pPolymorphKeepSelf`,
    removeAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveAE`,
    keepAEOnlyOriginNotEquipment: `${CONSTANTS.MODULE_NAME}.polymorphKeepAEOnlyOriginNotEquipment`,
  },

  /**
   * Transform this Actor into another one.
   *
   * @param {Actor} actorThis                 The original actor before transformation.
   * @param {Actor} targetActor                      The target Actor.
   * @param {TransformationOptions} [options={}]  Options that determine how the transformation is performed.
   * @returns {Promise<Array<Token>>|null}        Updated token if the transformation was performed.
   */
  async transformInto(
    tokenFromTransform: Token,
    actorThis: Actor,
    targetActor: Actor,
    transformOptions: TransformOptionsGeneric | undefined = undefined,
    renderSheet = true,
  ) {
    const keepPhysical = transformOptions?.keepPhysical || false;
    const keepMental = transformOptions?.keepMental || false;
    const keepSaves = transformOptions?.keepSaves || false;
    // const keepSkills = transformOptions?.keepSkills || false;
    const mergeSaves = transformOptions?.mergeSaves || false;
    const mergeSkills = transformOptions?.mergeSkills || false;
    const keepClass = transformOptions?.keepClass || false;
    const keepFeats = transformOptions?.keepFeats || false;
    const keepSpells = transformOptions?.keepSpells || false;
    const keepItems = transformOptions?.keepItems || false;
    const keepBio = transformOptions?.keepBio || false;
    const keepVision = transformOptions?.keepVision || false;
    const keepSelf = transformOptions?.keepSelf || false;
    const removeAE = transformOptions?.removeAE || false;
    const keepAEOnlyOriginNotEquipment = transformOptions?.keepAEOnlyOriginNotEquipment || false;
    const transformTokens = transformOptions?.transformTokens || true;

    // Get the original Actor data and the new source data
    const o = <any>actorThis.toJSON();
    //o.flags.dnd5e = o.flags.dnd5e || {};
    //o.flags.dnd5e.transformOptions = {mergeSkills, mergeSaves};
    if (getProperty(o.flags, `${CONSTANTS.MODULE_NAME}`)) {
      setProperty(o.flags, `${CONSTANTS.MODULE_NAME}`, {});
    }
    setProperty(o.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.TRANSFORMER_OPTIONS}`, {
      mergeSkills,
      mergeSaves,
    });
    // const actorUpdates = <any>targetActor.toJSON();
    /* get the full actor data */
    const actorUpdates = targetActor.toObject();
    /**
     * dnd5e: npc and character are nearly interchangable.
     * If we dont switch the type, we dont have to fool
     * with the sheet app caching.
     */
    //@ts-ignore
    delete actorUpdates.type;

    let d = <any>new Object();
    if (keepSelf) {
      // Keep Self
      mergeObject(d, o);
    }

    // Prepare new data to merge from the source
    d = {
      type: o.type, // Remain the same actor type
      name: `${o.name} (${actorUpdates.name})`, // Append the new shape to your old name
      data: actorUpdates.data, // Get the data model of your new form
      items: actorUpdates.items, // Get the items of your new form
      effects: o.effects.concat(actorUpdates.effects), // Combine active effects from both forms
      img: actorUpdates.img, // New appearance
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
    d.data.attributes.ac.flat = targetActor.data.data.attributes.ac.value; // Override AC

    // Token appearance updates
    d.token = <PrototypeTokenData>{ name: d.name };
    for (const k of ['width', 'height', 'scale', 'img', 'mirrorX', 'mirrorY', 'tint', 'alpha', 'lockRotation']) {
      d.token[k] = actorUpdates.token[k];
    }

    if (actorUpdates.token.randomImg) {
      const images = await targetActor.getTokenImages();
      d.token.img = <string>images[Math.floor(Math.random() * images.length)];
    }

    if (!keepSelf) {
      const vision = keepVision ? o.token : actorUpdates.token;
      for (const k of ['dimSight', 'brightSight', 'dimLight', 'brightLight', 'vision', 'sightAngle']) {
        d.token[k] = vision[k];
      }

      // Transfer ability scores
      //@ts-ignore
      const abilities = d.data.abilities;
      for (const k of Object.keys(abilities)) {
        const oa = o.data.abilities[k];
        const prof = abilities[k].proficient;
        if (keepPhysical && ['str', 'dex', 'con'].includes(k)) abilities[k] = oa;
        else if (keepMental && ['int', 'wis', 'cha'].includes(k)) abilities[k] = oa;
        if (keepSaves) abilities[k].proficient = oa.proficient;
        else if (mergeSaves) abilities[k].proficient = Math.max(prof, oa.proficient);
      }

      // Transfer skills
      // if (keepSkills) d.data.skills = o.data.skills;
      // else if (mergeSkills) {
      //   // eslint-disable-next-line prefer-const
      //   for (let [k, s] of Object.entries(d.data.skills)) {
      //     //@ts-ignore
      //     s.value = Math.max(<number>(<any>s).value, o.data.skills[k].value);
      //   }
      // }

      // Keep specific items from the original data
      d.items = d.items.concat(
        o.items.filter((i) => {
          if (['class', 'subclass'].includes(i.type)) return keepClass;
          else if (i.type === 'feat') return keepFeats;
          else if (i.type === 'spell') return keepSpells;
          else return keepItems;
        }),
      );

      // Transfer classes for NPCs
      if (!keepClass && d.data.details.cr) {
        d.items.push({
          type: 'class',
          name: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphTmpClass`),
          data: { levels: d.data.details.cr },
        });
      }

      // Keep biography
      if (keepBio) d.data.details.biography = o.data.details.biography;

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
    setProperty(
      d.flags,
      `${CONSTANTS.MODULE_NAME}`,
      getProperty(tokenFromTransform.document.data.flags, `${CONSTANTS.MODULE_NAME}`),
    );
    //setProperty(d.flags, `${CONSTANTS.MODULE_NAME}`, getProperty(actorThis.data.flags, `${CONSTANTS.MODULE_NAME}`));
    mergeObject(d.flags, actorThis.data.flags);
    if (
      //!actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED) ||
      !tokenFromTransform.document.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED) ||
      !getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
    ) {
      setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, actorThis.id);
    }
    setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);

    if (!d.token.flags) {
      d.token.flags = {};
    }
    mergeObject(d.token.flags, d.flags);
    /**
     * A hook event that fires just before the actor is transformed.
     * @function dnd5e.transformActor
     * @memberof hookEvents
     * @param {Token} tokenFromTransform
     * @param {Actor} actorThis                 The original actor before transformation.
     * @param {Actor} target                 The target actor into which to transform.
     * @param {object} data                    The data that will be used to create the new transformed actor.
     * @param {TransformationOptions} options  Options that determine how the transformation is performed.
     */
    Hooks.callAll(
      `${CONSTANTS.MODULE_NAME}.transformActor`,
      tokenFromTransform,
      actorThis,
      targetActor,
      d,
      transformOptions,
      renderSheet,
    );

    // Update placed Token instances
    if (!transformTokens) {
      let arrayMutationNames: string[] = <string[]>(
        tokenFromTransform.document?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT)
      );
      if (!arrayMutationNames || arrayMutationNames.length == 0) {
        arrayMutationNames =
          <string[]>actorThis?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT) || [];
      }
      const mutationNameOriginalToken = tokenFromTransform.id + '_' + randomID();
      if (!arrayMutationNames.includes(mutationNameOriginalToken)) {
        arrayMutationNames.push(mutationNameOriginalToken);
      }
      setProperty(
        d.token.flags,
        `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`,
        arrayMutationNames,
      );

      info(`${tokenFromTransform.name} mutate into a ${targetActor.name}`);
      // TODO show on chat ?
      //await ChatMessage.create({content: `${actorThis.name} mutate into a ${actorToTransform.name}`, speaker:{alias: actorThis.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
      //@ts-ignore
      await warpgate.mutate(
        tokenFromTransform.document,
        d, // tokenDataToTransform, //{}, //customTokenData || {},
        {},
        {
          name: mutationNameOriginalToken, // User provided name, or identifier, for this particular mutation operation. Used for 'named revert'.
        },
      );
      return;
    }

    const tokens = actorThis.getActiveTokens(true);
    const updates = tokens.map(async (t: Token) => {
      const newTokenData = <any>foundry.utils.deepClone(d);
      newTokenData.token._id = t.data._id;
      //newTokenData.token.actorId = <string>newActor.id;
      //newTokenData.token.actorLink = true;
      let arrayMutationNames: string[] = <string[]>(
        tokenFromTransform.document?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT)
      );
      if (!arrayMutationNames || arrayMutationNames.length == 0) {
        arrayMutationNames =
          <string[]>actorThis?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT) || [];
      }
      const mutationNameOriginalToken = tokenFromTransform.id + '_' + randomID();
      if (!arrayMutationNames.includes(mutationNameOriginalToken)) {
        arrayMutationNames.push(mutationNameOriginalToken);
      }
      // Set the flags again before the transformation
      if (!newTokenData.token.flags) {
        setProperty(newTokenData.token, `flags`, {});
      }
      setProperty(
        newTokenData.token.flags,
        `${CONSTANTS.MODULE_NAME}`,
        getProperty(actorThis.data.flags, `${CONSTANTS.MODULE_NAME}`),
      );
      setProperty(
        newTokenData.token.flags,
        `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`,
        actorThis.id,
      );

      setProperty(newTokenData.token.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
      setProperty(
        newTokenData.token.flags,
        `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`,
        arrayMutationNames,
      );

      info(`${t.name} mutate into a ${newTokenData.token.name}`);

      // TODO show on chat ?
      //await ChatMessage.create({content: `${actorThis.name} mutate into a ${actorToTransform.name}`, speaker:{alias: actorThis.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
      //@ts-ignore
      await warpgate.mutate(
        t.document,
        newTokenData,
        {},
        {
          name: mutationNameOriginalToken, // User provided name, or identifier, for this particular mutation operation. Used for 'named revert'.
        },
      );
      return newTokenData;
    });
  },

  /**
   * If this actor was transformed with transformTokens enabled, then its
   * active tokens need to be returned to their original state. If not, then
   * we can safely just delete this actor.
   * @param {boolean} [renderSheet] Render Sheet after revert the transformation.
   * @returns {Promise<Actor>|null}  Original actor if it was reverted.
   */
  async revertOriginalForm(sourceToken: Token, actorThis: Actor, renderSheet = true) {
    // if (!actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED)) {
    //   return;
    // }
    // if (!actorThis.isOwner) {
    //   return warn(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphRevertWarn`), true);
    // }
    if (!sourceToken.document.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED)) {
      warn(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphRevertWarn`), true);
      return;
    }
    if (!sourceToken.isOwner) {
      warn(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphRevertWarn`), true);
      return;
    }

    /**
     * A hook event that fires just before the actor is reverted to original form.
     * @function dnd5e.transformActor
     * @memberof hookEvents
     * @param {Token} sourceToken
     * @param {Actor} actorThis                 The original actor before transformation.
     * @param {boolean} renderSheet             Render Sheet after revert the transformation.
     */
    Hooks.callAll(`${CONSTANTS.MODULE_NAME}.revertOriginalForm`, sourceToken, actorThis, renderSheet);

    const previousOriginalActorTokenData = <TokenData[]>(
      sourceToken.document.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
    );
    let isTheOriginalActor = false;
    if (!previousOriginalActorTokenData || previousOriginalActorTokenData.length <= 0) {
      isTheOriginalActor = true;
    }

    let arrayMutationNames: string[] = <string[]>(
      sourceToken.document?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT)
    );
    if (!arrayMutationNames || arrayMutationNames.length == 0) {
      arrayMutationNames = [];
      warn(`Array mutation names for the revert is null or empty`);
    }
    try {
      if (arrayMutationNames.length > 0) {
        for (const revertName of arrayMutationNames) {
          info(`${sourceToken.document.name} reverts to their original form`);
          // TODO show on chat ?
          //await ChatMessage.create({content: `${actor.name} reverts to their original form`, speaker:{alias: actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
          //@ts-ignore
          await warpgate.revert(sourceToken.document, revertName);
        }
      } else {
        //@ts-ignore
        await warpgate.revert(sourceToken.document, '');
      }
    } finally {
      await actorThis.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
      await actorThis.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
      await actorThis.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
      await actorThis.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);

      await sourceToken.document.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
      await sourceToken.document.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
      await sourceToken.document.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
      await sourceToken.document.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);
    }
    // Obtain a reference to the original actor
    const original = <Actor>(
      game.actors?.get(<string>sourceToken.document.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR))
    );
    if (!original) {
      if (!previousOriginalActorTokenData) {
        warn(
          game.i18n.format(`${CONSTANTS.MODULE_NAME}.polymorphRevertNoOriginalActorWarn`, {
            reference: <string>sourceToken.document.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR),
          }),
          true,
        );
        return;
      }
    }

    return original;
  },

  async renderDialogTransformOptions(
    actorFromTransform: Actor,
    actorToTransform: Actor,
    animation: string,
    tokenFromTransform: Token,
  ) {
    const tokenUpdatesToTransform = <TokenData>await actorToTransform.getTokenData();

    // Define a function to record polymorph settings for future use
    const rememberOptions = (html) => {
      const options = {};
      html.find('input').each((i, el) => {
        options[el.name] = el.checked;
      });
      //const settings = mergeObject(<TransformOptionsDnd5e>game.settings.get(CONSTANTS.MODULE_NAME, "polymorphSettings") || {}, options);
      //game.settings.set(CONSTANTS.MODULE_NAME, 'polymorphSettings', settings);
      // TODO findd a way to sav the custom settings on client side
      const settings = mergeObject(this.polymorphSettings || {}, options);
      return settings;
    };

    const i18nPolymorphSettingsTmp: any = {};
    for (const key in this.i18nPolymorphSettings) {
      const value = i18n(this.i18nPolymorphSettings[key]);
      i18nPolymorphSettingsTmp[key] = value;
    }

    // Create and render the Dialog
    return new Dialog(
      {
        title: i18n(`${CONSTANTS.MODULE_NAME}.polymorphPromptTitle`),
        //@ts-ignore
        content: {
          options: this.polymorphSettings,
          i18n: i18nPolymorphSettingsTmp,
          isToken: actorFromTransform.isToken,
        },
        default: 'accept',
        buttons: {
          accept: {
            icon: '<i class="fas fa-check"></i>',
            label: i18n(`${CONSTANTS.MODULE_NAME}.polymorphAcceptSettings`),
            callback: async (html) => {
              if (tokenFromTransform) {
                if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                  game.macros
                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                    //@ts-ignore
                    ?.execute(tokenFromTransform, tokenUpdatesToTransform);
                } else {
                  ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenUpdatesToTransform);
                }
                await wait(ANIMATIONS.animationFunctions[animation].time);
              }
              info(`${actorFromTransform.name} turns into a ${actorToTransform.name}`);
              // TODO show on chat ?
              //await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
              await this.transformInto(actorFromTransform, actorToTransform, rememberOptions(html), false);
            },
          },
          wildshape: {
            icon: '<i class="fas fa-paw"></i>',
            label: i18n(`${CONSTANTS.MODULE_NAME}.polymorphWildShape`),
            callback: async (html) => {
              if (tokenFromTransform) {
                if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                  game.macros
                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                    //@ts-ignore
                    ?.execute(tokenFromTransform, tokenUpdatesToTransform);
                } else {
                  ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenUpdatesToTransform);
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
            },
          },
          polymorph: {
            icon: '<i class="fas fa-pastafarianism"></i>',
            label: i18n(`${CONSTANTS.MODULE_NAME}.polymorph`),
            callback: async (html) => {
              if (tokenFromTransform) {
                if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                  game.macros
                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                    //@ts-ignore
                    ?.execute(tokenFromTransform, tokenUpdatesToTransform);
                } else {
                  ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenUpdatesToTransform);
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
            },
          },
          self: {
            icon: '<i class="fas fa-eye"></i>',
            label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphSelf`),
            callback: (html) =>
              this.transformInto(
                actorFromTransform,
                actorToTransform,
                {
                  keepSelf: true,
                  transformTokens: rememberOptions(html).transformTokens,
                },
                false,
              ),
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: i18n('Cancel'),
          },
        },
      },
      {
        classes: ['dialog', `${CONSTANTS.MODULE_NAME}`],
        width: 600,
        template: `modules/${CONSTANTS.MODULE_NAME}/templates/polymorph-prompt.hbs`,
      },
    );
  },
};
