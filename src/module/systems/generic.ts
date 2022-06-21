
import type { ActorData, PrototypeTokenData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import { PolymorpherFlags } from "../automatedPolymorpherModels";
import CONSTANTS from "../constants";
import { warn } from "../lib/lib";

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
  async transformInto(actorThis:Actor, target:Actor, { keepPhysical=false, keepMental=false, keepSaves=false, keepSkills=false,
    mergeSaves=false, mergeSkills=false, keepClass=false, keepFeats=false, keepSpells=false,
    keepItems=false, keepBio=false, keepVision=false,
    keepSelf=false, removeAE=false, keepAEOnlyOriginNotEquipment=false,
    transformTokens=true}={}, renderSheet=true) {

    // Ensure the player is allowed to polymorph
    // const allowed = game.settings.get("dnd5e", "allowPolymorphing");
    // if ( !allowed && !game.user?.isGM ) {
    //   return ui.notifications.warn(game.i18n.localize("DND5E.PolymorphWarn"));
    // }

    // Get the original Actor data and the new source data
    const o = <any>actorThis.toJSON();
    // MOD 4535992
    //o.flags.dnd5e = o.flags.dnd5e || {};
    //o.flags.dnd5e.transformOptions = {mergeSkills, mergeSaves};
    setProperty(o.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.TRANSFORMER_OPTIONS}`, {mergeSkills, mergeSaves});
    const source = <any>target.toJSON();

    let d = <any>new Object();
    if(keepSelf){
      // Keep Self
      mergeObject(d,o);
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
      flags: o.flags // Use the original actor flags
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
    d.token = <PrototypeTokenData>{name: d.name};
    for (const k of ["width", "height", "scale", "img", "mirrorX", "mirrorY", "tint", "alpha", "lockRotation"] ) {
      d.token[k] = source.token[k];
    }

    if ( source.token.randomImg ) {
      const images = await target.getTokenImages();
      d.token.img = <string>images[Math.floor(Math.random() * images.length)];
    }

    if(!keepSelf){

    const vision = keepVision ? o.token : source.token;
    for (const k of ["dimSight", "brightSight", "dimLight", "brightLight", "vision", "sightAngle"] ) {
      d.token[k] = vision[k];
    }

    // Transfer ability scores
    //@ts-ignore
    const abilities = d.data.abilities;
    for (const k of Object.keys(abilities) ) {
      const oa = o.data.abilities[k];
      const prof = abilities[k].proficient;
      if ( keepPhysical && ["str", "dex", "con"].includes(k) ) abilities[k] = oa;
      else if ( keepMental && ["int", "wis", "cha"].includes(k) ) abilities[k] = oa;
      if ( keepSaves ) abilities[k].proficient = oa.proficient;
      else if ( mergeSaves ) abilities[k].proficient = Math.max(prof, oa.proficient);
    }

    // Transfer skills
    if ( keepSkills ) d.data.skills = o.data.skills;
    else if ( mergeSkills ) {
      // eslint-disable-next-line prefer-const
      for ( let [k, s] of Object.entries(d.data.skills) ) {
        //@ts-ignore
        s.value = Math.max(<number>(<any>s).value, o.data.skills[k].value);
      }
    }

    // Keep specific items from the original data
    d.items = d.items.concat(o.items.filter(i => {
      if ( ["class", "subclass"].includes(i.type) ) return keepClass;
      else if ( i.type === "feat" ) return keepFeats;
      else if ( i.type === "spell" ) return keepSpells;
      else return keepItems;
    }));

    // Transfer classes for NPCs
    if ( !keepClass && d.data.details.cr ) {
      d.items.push({
        type: "class",
        name: game.i18n.localize("DND5E.PolymorphTmpClass"),
        data: { levels: d.data.details.cr }
      });
    }

    // Keep biography
    if (keepBio) d.data.details.biography = o.data.details.biography;

    // Keep senses
    if (keepVision) d.data.traits.senses = o.data.traits.senses;

    // Not keep active effects
    if(removeAE && !keepAEOnlyOriginNotEquipment) d.effects = [];

    // Keep active effects only origin not equipment
    if(keepAEOnlyOriginNotEquipment){
      const tokenEffects = foundry.utils.deepClone(d.effects) || [];
      const notEquipItems = ["feat", "spell", "class", "subclass"];
      const tokenEffectsNotEquipment:any[] = [];
      for(const effect of tokenEffects) {
        if(!effect.origin.toLowerCase().startsWith("item")){
          tokenEffectsNotEquipment.push(effect);
        }
      }
      d.effects = tokenEffectsNotEquipment;
    }

    }

    // Set new data flags
    // if ( !actorThis.isPolymorphed || !d.flags.dnd5e.originalActor ) d.flags.dnd5e.originalActor = actorThis.id;
    // d.flags.dnd5e.isPolymorphed = true;
    if ( !actorThis.getFlag(CONSTANTS.MODULE_NAME,PolymorpherFlags.IS_POLYMORPHED) ||
      !getProperty(d.flags,`${PolymorpherFlags.IS_POLYMORPHED}.${PolymorpherFlags.ORIGINAL_ACTOR}` )) {
        setProperty(d.flags,`${PolymorpherFlags.IS_POLYMORPHED}.${PolymorpherFlags.ORIGINAL_ACTOR}`,actorThis.id);
    }
    setProperty(d.flags,`${PolymorpherFlags.IS_POLYMORPHED}`,true);

    // Update unlinked Tokens in place since they can simply be re-dropped from the base actor
    if ( actorThis.isToken ) {
      const tokenData = d.token;
      // tokenData.actorData = d;
      setProperty(tokenData,`actorData`,d);
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
    Hooks.callAll(`${CONSTANTS.MODULE_NAME}.transformActor`, actorThis, target, d, {
      keepPhysical, keepMental, keepSaves, keepSkills, mergeSaves, mergeSkills,
      keepClass, keepFeats, keepSpells, keepItems, keepBio, keepVision, keepSelf, removeAE, keepAEOnlyOriginNotEquipment, transformTokens, renderSheet
    });

    // Some info like height and weight of the token are reset to default
    // after the constructor of the actor is invoked solved with a backup of the info of the token
    const tokenBackup = duplicate(d.token);
    // Create new Actor with transformed data
    //@ts-ignore
    const newActor = await actorThis.constructor.create(d, {renderSheet: renderSheet});
    mergeObject(d.token, tokenBackup);

    // Update placed Token instances
    if ( !transformTokens ) return;
    const tokens = actorThis.getActiveTokens(true);
    const updates = tokens.map(t => {
      const newTokenData = foundry.utils.deepClone(d.token);
      newTokenData._id = t.data._id;
      //@ts-ignore
      newTokenData.actorId = <string>newActor.id;
      newTokenData.actorLink = true;
      return newTokenData;
    });
    //@ts-ignore
    return canvas.scene?.updateEmbeddedDocuments("Token", updates);
  },

  /* -------------------------------------------- */

  /**
   * If this actor was transformed with transformTokens enabled, then its
   * active tokens need to be returned to their original state. If not, then
   * we can safely just delete this actor.
   * @param {boolean} [renderSheet] Render Sheet after revert the transformation.
   * @returns {Promise<Actor>|null}  Original actor if it was reverted.
   */
  async revertOriginalForm(actorThis:Actor, renderSheet=true) {
    if ( !actorThis.getFlag(CONSTANTS.MODULE_NAME,PolymorpherFlags.IS_POLYMORPHED) ) return;
    if ( !actorThis.isOwner ) {
      return warn(game.i18n.localize("DND5E.PolymorphRevertWarn"), true);
    }

    /**
     * A hook event that fires just before the actor is reverted to original form.
     * @function dnd5e.transformActor
     * @memberof hookEvents
     * @param {Actor} actorThis                 The original actor before transformation.
     * @param {boolean} renderSheet             Render Sheet after revert the transformation.
     */
    Hooks.callAll(`${CONSTANTS.MODULE_NAME}.revertOriginalForm`, actorThis, renderSheet);

    // If we are reverting an unlinked token, simply replace it with the base actor prototype
    if ( actorThis.isToken ) {
      const baseActor = <Actor>game.actors?.get(<string>actorThis.token?.data.actorId);
      const prototypeTokenData = await baseActor.getTokenData();
      const tokenUpdate = {actorData: {}};
      for ( const k of ["width", "height", "scale", "img", "mirrorX", "mirrorY", "tint", "alpha", "lockRotation", "name"] ) {
        tokenUpdate[k] = prototypeTokenData[k];
      }
      await actorThis.token?.update(tokenUpdate, {recursive: false});
      await actorThis.sheet?.close();
      const actor = <Actor>actorThis.token?.getActor();
      if ( renderSheet ) {
        actor.sheet?.render(true);
      }
      return actor;
    }

    // Obtain a reference to the original actor
    const original = game.actors?.get(<string>actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR));
    if ( !original ) {
      warn(game.i18n.format("DND5E.PolymorphRevertNoOriginalActorWarn", { reference: <string>actorThis.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR) }), true);
      return;
    }
    // Get the Tokens which represent this actor
    if ( canvas.ready ) {
      const tokens = actorThis.getActiveTokens(true);
      const tokenData = await original.getTokenData();
      const tokenUpdates = tokens.map(t => {
        const update = duplicate(tokenData);
        update._id = t.id;
        //@ts-ignore
        delete update.x;
        //@ts-ignore
        delete update.y;
        return update;
      });
      canvas.scene?.updateEmbeddedDocuments("Token", tokenUpdates);
    }

    // Delete the polymorphed version of the actor, if possible
    const isRendered = actorThis.sheet?.rendered;
    if ( game.user?.isGM ) await actorThis.delete();
    else if ( isRendered ) actorThis.sheet?.close();
    if ( isRendered && renderSheet ) {
      original.sheet?.render(isRendered);
    }
    return original;
  }

}
