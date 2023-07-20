import { ANIMATIONS } from "../animations.js";
import { PolymorpherFlags, transformationPresets, } from "../automatedPolymorpherModels.js";
import CONSTANTS from "../constants.js";
import { i18n, info, transferPermissionsActorInner, wait, warn } from "../lib/lib.js";
export default {
    /**
     * Options that determine what properties of the original actor are kept and which are replaced with
     * the target actor.
     *
     * @typedef {object} TransformationOptions
     * @property {boolean} [keepPhysical=false]       Keep physical abilities (str, dex, con)
     * @property {boolean} [keepMental=false]         Keep mental abilities (int, wis, cha)
     * @property {boolean} [keepSaves=false]          Keep saving throw proficiencies
     * @property {boolean} [keepSkills=false]         Keep skill proficiencies
     * @property {boolean} [mergeSaves=false]         Take the maximum of the save proficiencies
     * @property {boolean} [mergeSkills=false]        Take the maximum of the skill proficiencies
     * @property {boolean} [keepClass=false]          Keep proficiency bonus
     * @property {boolean} [keepFeats=false]          Keep features
     * @property {boolean} [keepSpells=false]         Keep spells
     * @property {boolean} [keepItems=false]          Keep items
     * @property {boolean} [keepBio=false]            Keep biography
     * @property {boolean} [keepVision=false]         Keep vision
     * @property {boolean} [keepSelf=false]           Keep self
     * @property {boolean} [keepAE=false]             Keep all effects
     * @property {boolean} [keepOriginAE=true]        Keep effects which originate on this actor
     * @property {boolean} [keepOtherOriginAE=true]   Keep effects which originate on another actor
     * @property {boolean} [keepSpellAE=true]         Keep effects which originate from actors spells
     * @property {boolean} [keepFeatAE=true]          Keep effects which originate from actors features
     * @property {boolean} [keepEquipmentAE=true]     Keep effects which originate on actors equipment
     * @property {boolean} [keepClassAE=true]         Keep effects which originate from actors class/subclass
     * @property {boolean} [keepBackgroundAE=true]    Keep effects which originate from actors background
     * @property {boolean} [transformTokens=true]     Transform linked tokens too
     * @property {string} [explicitName]  Explicit name for generated actor
     */
    polymorphSettings: {
        keepPhysical: false,
        keepMental: false,
        keepSaves: false,
        keepSkills: false,
        mergeSaves: false,
        mergeSkills: false,
        keepClass: false,
        keepFeats: false,
        keepSpells: false,
        keepItems: false,
        keepBio: false,
        keepVision: true,
        keepSelf: false,
        keepAE: false,
        // removeAE: false,
        // keepAEOnlyOriginNotEquipment: false,
        keepOriginAE: true,
        keepOtherOriginAE: true,
        keepSpellAE: true,
        keepEquipmentAE: true,
        keepFeatAE: true,
        keepClassAE: true,
        keepBackgroundAE: true,
        //
        transformTokens: true,
        explicitName: "",
    },
    /**
     * Settings to configure how actors are merged when polymorphing is applied.
     * @enum {string}
     */
    i18nPolymorphSettings: {
        keepPhysical: `${CONSTANTS.MODULE_NAME}.polymorphKeepPhysical`,
        keepMental: `${CONSTANTS.MODULE_NAME}.polymorphKeepMental`,
        keepSaves: `${CONSTANTS.MODULE_NAME}.polymorphKeepSaves`,
        keepSkills: `${CONSTANTS.MODULE_NAME}.polymorphKeepSkills`,
        mergeSaves: `${CONSTANTS.MODULE_NAME}.polymorphMergeSaves`,
        mergeSkills: `${CONSTANTS.MODULE_NAME}.polymorphMergeSkills`,
        keepClass: `${CONSTANTS.MODULE_NAME}.polymorphKeepClass`,
        keepFeats: `${CONSTANTS.MODULE_NAME}.polymorphKeepFeats`,
        keepSpells: `${CONSTANTS.MODULE_NAME}.polymorphKeepSpells`,
        keepItems: `${CONSTANTS.MODULE_NAME}.polymorphKeepItems`,
        keepBio: `${CONSTANTS.MODULE_NAME}.polymorphKeepBio`,
        keepVision: `${CONSTANTS.MODULE_NAME}.polymorphKeepVision`,
        keepSelf: `${CONSTANTS.MODULE_NAME}.polymorphKeepSelf`,
        transformTokens: `${CONSTANTS.MODULE_NAME}.polymorphTransformTokens`,
        explicitName: `${CONSTANTS.MODULE_NAME}.polymorphExplicitName`,
    },
    /**
     * Settings to configure how actors are effects are merged when polymorphing is applied.
     * @enum {string}
     */
    i18nPolymorphEffectSettings: {
        keepAE: `${CONSTANTS.MODULE_NAME}.polymorphKeepAE`,
        // removeAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveAE`,
        removeOtherOriginAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveOtherOriginAE`,
        removeOriginAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveOriginAE`,
        removeEquipmentAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveEquipmentAE`,
        removeFeatAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveFeatureAE`,
        removeSpellAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveSpellAE`,
        removeClassAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveClassAE`,
        removeBackgroundAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveBackgroundAE`,
    },
    /**
     * Transform this Actor into another one.
     *
     * @param {Token} sourceToken                 The original token before transformation.
     * @param {Actor} sourceActor                 The original actor before transformation.
     * @param {Actor} targetActor                      The target Actor.
     * @param {TransformationOptions} [options={}]  Options that determine how the transformation is performed.
     * @param {object} [options]
     * @param {boolean} [options.renderSheet=true]  Render the sheet of the transformed actor after the polymorph
     * @returns {Promise<Array<Token>>|null}        Updated token if the transformation was performed.
     */
    async transformInto(sourceToken, sourceActor, targetActor, transformOptions = undefined, renderSheet = true, externalUserId = game.user?.id) {
        const useWarpGate = game.settings.get(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate");
        const transformTokens = transformOptions?.transformTokens || true;
        // Get the original Actor data and the new source data
        const originalActorData = sourceActor.toObject(false);
        const targetActorData = targetActor.toObject(false);
        const targetActorImages = await targetActor.getTokenImages();
        //@ts-ignore
        const sourceEffects = sourceToken.actor ? sourceToken.actor.effects : sourceToken.effects;
        const d = await this.prepareDataFromTransformOptions(originalActorData, targetActorData, sourceEffects, targetActorImages, transformOptions);
        /**
         * A hook event that fires just before the actor is transformed.
         * @function dnd5e.transformActor
         * @memberof hookEvents
         * @param {Token} sourceToken
         * @param {Actor} sourceActor                       The original actor before transformation.
         * @param {Actor} targetActor                       The target actor into which to transform.
         * @param {object} d                                The data that will be used to create the new transformed actor.
         * @param {TransformationOptions} transformOptions  Options that determine how the transformation is performed.
         */
        Hooks.callAll(`${CONSTANTS.MODULE_NAME}.transformActor`, sourceToken, sourceActor, targetActor, d, transformOptions, renderSheet);
        // =====================================
        // END SPECIFIC MANAGEMENT FOR SYSTEM
        // =====================================
        // Set new data flags
        // TODO FIND A BTTER CODE FOR THIS)
        if (!sourceToken.actor) {
            setProperty(sourceToken, `actor`, {});
        }
        //@ts-ignore
        if (!sourceToken.actor?.flags) {
            setProperty(sourceToken.actor, `flags`, {});
        }
        //@ts-ignore
        if (!sourceToken.actor?.flags[CONSTANTS.MODULE_NAME]) {
            //@ts-ignore
            setProperty(sourceToken.actor?.flags, `${CONSTANTS.MODULE_NAME}`, {});
        }
        setProperty(d.flags, `${CONSTANTS.MODULE_NAME}`, 
        //@ts-ignore
        getProperty(sourceToken.actor?.flags, `${CONSTANTS.MODULE_NAME}`));
        //setProperty(d.flags, `${CONSTANTS.MODULE_NAME}`, getProperty(actorThis.flags, `${CONSTANTS.MODULE_NAME}`));
        //@ts-ignore
        mergeObject(d.flags, sourceActor.flags);
        if (!sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED) ||
            !getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)) {
            setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, sourceActor.id);
        }
        setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
        let previousTokenData = (sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)) || [];
        // const currentTokenData = await sourceActor.getTokenDocument();
        const currentTokenData = sourceToken.document;
        if (currentTokenData.id && previousTokenData.filter((z) => z.id === currentTokenData.id).length <= 0) {
            previousTokenData.push({
                //@ts-ignore
                actorId: currentTokenData.actorId,
                id: currentTokenData.id,
            });
            previousTokenData = previousTokenData.filter((value, index, self) => index === self.findIndex((t) => t.id === null || t.id === value.id));
        }
        setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}`, previousTokenData);
        if (!d.prototypeToken.flags) {
            d.prototypeToken.flags = {};
        }
        mergeObject(d.prototypeToken.flags, d.flags);
        // Step up the array of mutation names
        let arrayMutationNames = (sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT));
        if (!arrayMutationNames || arrayMutationNames.length == 0) {
            arrayMutationNames =
                sourceActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT) || [];
        }
        const mutationNameOriginalToken = sourceToken.id + "_" + randomID();
        if (!arrayMutationNames.includes(mutationNameOriginalToken)) {
            arrayMutationNames.push(mutationNameOriginalToken);
        }
        setProperty(d.prototypeToken.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`, arrayMutationNames);
        // Close sheet for non-transformed Actor
        await sourceActor.sheet?.close();
        if (useWarpGate) {
            // =============================================
            // THIS IS THE SOLUTION WITH WARP GATE (AVOID THE CREATION OF ACTOR)
            // ===========================================
            /* get the new protodata and remove its null x/y */
            const newActor = targetActor;
            //@ts-ignore
            let proto = (await newActor.getTokenDocument()).toObject();
            //@ts-ignore
            delete proto.x;
            //@ts-ignore
            delete proto.y;
            /* overwrite any fields of the original with fields from the new proto */
            // proto = mergeObject(sourceToken.toObject(), proto, {inplace:false});
            //@ts-ignore
            proto = mergeObject(proto, d, { inplace: false });
            //proto = mergeObject(d, proto, {inplace:false});
            /* remove erroneous fields */
            //@ts-ignore
            delete proto.actorData;
            //@ts-ignore
            delete proto._id;
            /* get the root actor data (i.e. no embedded collections) */
            //const actorData = _getRootActorData(newActor)
            // START _getRootActorData
            /* returns the actor data sans ALL embedded collections */
            const newRootActorData = newActor.toObject();
            // Transfer flags module from token to actor
            if (!getProperty(newRootActorData, `flags`)) {
                setProperty(newRootActorData, `flags`, {});
            }
            if (!getProperty(newRootActorData.flags, `${CONSTANTS.MODULE_NAME}`)) {
                setProperty(newRootActorData.flags, `${CONSTANTS.MODULE_NAME}`, {});
            }
            //@ts-ignore
            mergeObject(newRootActorData.flags[CONSTANTS.MODULE_NAME], d.prototypeToken.flags[CONSTANTS.MODULE_NAME]);
            /* get the key NAME of the embedded document type.
             * ex. not 'ActiveEffect' (the class name), 'effect' the collection's field name
             */
            //@ts-ignore
            const embeddedFields = Object.values(Actor.implementation.metadata.embedded).map(
            //@ts-ignore
            (thisClass) => thisClass.metadata.collection);
            /* delete any embedded fields from the actor data */
            embeddedFields.forEach((field) => {
                delete newRootActorData[field];
            });
            // END _getRootActorData
            /* for some strange reason for pass the elemnt to the actor i nedd to reset everything for the actor */
            /* for things like effects ecc... */
            // TODO
            const newActorData = await this.prepareDataFromTransformOptions(newRootActorData, targetActorData, 
            //@ts-ignore
            proto.effects, targetActorImages, transformOptions);
            //@ts-ignore
            // newActorData.effects = proto.effects;
            // delete newActorData.effects;
            //@ts-ignore
            delete newActorData._id;
            if (!getProperty(newActorData.flags, `${CONSTANTS.MODULE_NAME}`)) {
                setProperty(newActorData.flags, `${CONSTANTS.MODULE_NAME}`, {});
            }
            //@ts-ignore
            mergeObject(newActorData.flags[CONSTANTS.MODULE_NAME], d.prototypeToken.flags[CONSTANTS.MODULE_NAME]);
            /* form the update */
            // const updates = {
            //   token: <TokenData>proto,
            //   actor: <any>newActorData
            // }
            delete newActorData.token;
            /* default is 0,0 -- let's stay where we are */
            // delete newActorData.token.x;
            // delete newActorData.token.y;
            const updates = {
                token: {
                    name: proto.name,
                    //@ts-ignore
                    img: proto.img,
                    // scale: proto.scale,
                    texture: {
                        //@ts-ignore
                        scaleX: proto.texture.scaleX,
                        //@ts-ignore
                        scaleY: proto.texture.scaleY,
                    },
                    system: proto,
                    // actor: actorToTransform
                    actor: {
                        system: newActorData.system,
                    },
                    // actorId: <string>newActor.id,
                    actorLink: false,
                },
                actor: {
                    system: newActorData.system,
                },
            };
            delete updates.token.document.token;
            delete updates.token.actor.token;
            /*
             * Protects the actor a bit more, but requires you
             * to close and repon the sheet after reverting.
             */
            updates.token.document.actorLink = false;
            /* leave the actor link unchanged for a more seamless mutation */
            delete updates.token.document.actorLink;
            /* we want to keep our source actor, not swap to a new one entirely */
            delete updates.token.document.actorId;
            /* default is 0,0 -- let's stay where we are */
            // delete updates.token.x;
            // delete updates.token.y;
            // delete the cached sheet to furce a full re-render
            const sheet = sourceToken.actor?.sheet;
            // await sourceToken.actor?.sheet?.close();
            //@ts-ignore
            delete sourceToken.actor?._sheet;
            delete sourceToken.actor?.apps[sheet.appId];
            // Update placed Token instances
            if (!transformTokens) {
                // ======================================================================================
                // SETTING FLAGS
                if (!updates.token.flags) {
                    setProperty(updates.token, `flags`, {});
                }
                setProperty(updates.token.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`));
                setProperty(updates.token.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
                setProperty(updates.token.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`, arrayMutationNames);
                // NEDDED FOR WARPGATE ????
                //@ts-ignore
                if (!updates.actor.flags) {
                    setProperty(updates.actor, `flags`, {});
                }
                setProperty(
                //@ts-ignore
                updates.actor.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`));
                setProperty(
                //@ts-ignore
                updates.actor.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`));
                setProperty(updates.actor, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
                // ======================================================================================
                // TODO show on chat ?
                //await ChatMessage.create({content: `${actorThis.name} mutate into a ${actorToTransform.name}`, speaker:{alias: actorThis.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
                //@ts-ignore
                const tokensMutate = await warpgate.mutate(sourceToken.document ? sourceToken.document : sourceToken, // TODO why sourceToken is a TokenDocument and not a Token ?
                updates, {}, {
                    name: mutationNameOriginalToken,
                    //comparisonKeys:{ ActiveEffect: 'label'}
                    delta: {
                        token: updates.token,
                        actor: updates.actor,
                        embedded: {},
                    },
                });
                return tokensMutate;
            }
            const tokens = sourceActor.getActiveTokens(true);
            tokens.map(async (t) => {
                const newTokenData = foundry.utils.deepClone(updates);
                //newTokenData._id = t.id;
                // ======================================================================================
                // SETTING FLAGS
                if (!newTokenData.token.flags) {
                    setProperty(newTokenData.token, `flags`, {});
                }
                setProperty(newTokenData.token.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`));
                setProperty(newTokenData.token.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
                setProperty(newTokenData.token.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`, arrayMutationNames);
                // NEDDED FOR WARPGATE ????
                if (!newTokenData.actor) {
                    setProperty(newTokenData, `actor`, {});
                }
                if (!newTokenData.actor.flags) {
                    setProperty(newTokenData.actor, `flags`, {});
                }
                setProperty(
                //@ts-ignore
                newTokenData.actor.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`));
                setProperty(
                //@ts-ignore
                newTokenData.actor.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`));
                setProperty(newTokenData.actor, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
                // =======================================================================================================
                // TODO show on chat ?
                //await ChatMessage.create({content: `${actorThis.name} mutate into a ${actorToTransform.name}`, speaker:{alias: actorThis.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
                //@ts-ignore
                const tokensMutate = await warpgate.mutate(t.document ? t.document : t, // TODO why sourceToken is a TokenDocument and not a Token ?
                newTokenData, {}, {
                    name: mutationNameOriginalToken,
                    //comparisonKeys:{ ActiveEffect: 'label'}
                    delta: {
                        token: updates.token,
                        actor: updates.actor,
                        embedded: {},
                    },
                });
                return tokensMutate;
            });
        }
        else {
            // =============================================
            // THIS IS THE DND5E SOLUTION WITh THE CREATION OF ACTOR)
            // ===========================================
            /*
            // Update unlinked Tokens, and grab a copy of any actorData adjustments to re-apply
            if ( this.isToken ) {
                const tokenData = d.prototypeToken;
                delete d.prototypeToken;
                d.flags.dnd5e.previousActorData = this.token.toObject().actorData;
                tokenData.actorData = d;
                await this.sheet?.close();
                const update = await this.token.update(tokenData);
                if (renderSheet) this.sheet?.render(true);
                return update;
            }
            */
            // Some info like height and weight of the token are reset to default
            // after the constructor of the actor is invoked solved with a backup of the info of the token
            const tokenBackup = duplicate(d.prototypeToken);
            // Create new Actor with transformed data
            //@ts-ignore
            const newActor = await sourceActor.constructor.create(d, { renderSheet: renderSheet });
            //@ts-ignore
            // TODO Understand why is not working work like on dnd5e
            // const newActor = await Actor.implementation.create(d, { renderSheet: renderSheet });
            // Force this to be true
            await newActor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED, true);
            await newActor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`));
            mergeObject(d.prototypeToken, tokenBackup);
            let originalActor = (game.actors?.get(sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR)));
            // If no originalActorIsFounded it must be the orginal itself
            if (!originalActor) {
                originalActor = sourceActor;
            }
            // await transferPermissionsActorInner(originalActor, newActor, externalUserId);
            // Update placed Token instances
            // if (!transformTokens) {
            //   return;
            // }
            let tokens = [];
            if (transformTokens) {
                tokens = sourceActor.getActiveTokens(true);
                if (!tokens || tokens.length == 0) {
                    tokens = sourceActor.getActiveTokens();
                }
                const tokensTmp = tokens.filter((t) => {
                    return sourceActor.id === t.actor?.id;
                });
                tokens = tokensTmp;
            }
            else {
                tokens = [sourceToken];
            }
            const updates = tokens.map((t) => {
                const newTokenData = foundry.utils.deepClone(d.prototypeToken);
                newTokenData._id = t.id;
                newTokenData.actorId = newActor.id;
                newTokenData.actorLink = true;
                if (!newTokenData.flags) {
                    setProperty(newTokenData, `flags`, {});
                }
                setProperty(newTokenData.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`));
                setProperty(newTokenData.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
                return newTokenData;
            });
            //@ts-ignore
            const tokensFinal = await canvas.scene?.updateEmbeddedDocuments("Token", updates);
            // TODO Understand why is not working work like on dnd5e
            // const tokensFinal = <TokenDocument[]>[];
            // for (const tokenUpdate of updates) {
            // 	//@ts-ignore
            // 	const token = await TokenDocument.implementation.create(tokenUpdate, {
            // 		parent: canvas.scene,
            // 		keepId: false, // MOD 4535992 on dnd5e is true
            // 		render: false, // MOD 4535992 on dnd5e is true
            // 	});
            // 	tokensFinal.push(token);
            // }
            for (const tokenFinal of tokensFinal) {
                // Force this to be true
                await tokenFinal.actor?.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED, true);
                await tokenFinal.actor?.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR, getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`));
            }
            await transferPermissionsActorInner(originalActor, newActor, externalUserId);
            /* run mutation and label it 'powermorph' */
            info(`${sourceToken.name} mutate into a ${targetActor.name}`);
            return tokensFinal[0];
        }
        return undefined;
    },
    /**
     * If this actor was transformed with transformTokens enabled, then its
     * active tokens need to be returned to their original state. If not, then
     * we can safely just delete this actor.
     * @param {boolean} [renderSheet] Render Sheet after revert the transformation.
     * @returns {Promise<Actor>|null}  Original actor if it was reverted.
     */
    async revertOriginalForm(sourceToken, sourceActor, renderSheet = true) {
        const useWarpGate = game.settings.get(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate");
        if (!sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED)) {
            warn(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphRevertWarn`) + ` type 1`, true);
            return;
        }
        if (!sourceToken.isOwner) {
            warn(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphRevertWarn`) + ` type 2`, true);
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
        Hooks.callAll(`${CONSTANTS.MODULE_NAME}.revertOriginalForm`, sourceToken, sourceActor, renderSheet);
        const previousOriginalActorTokenData = (sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR));
        let isTheOriginalActor = false;
        if (!previousOriginalActorTokenData || previousOriginalActorTokenData.length <= 0) {
            isTheOriginalActor = true;
        }
        // Obtain a reference to the original actor
        const original = (game.actors?.get(sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR)));
        // If we are reverting an unlinked token, grab the previous actorData, and create a new token
        /*
        if ( this.isToken ) {
            const baseActor = original ? original : game.actors.get(this.token.actorId);
            if ( !baseActor ) {
                ui.notifications.warn(game.i18n.format("DND5E.PolymorphRevertNoOriginalActorWarn", {
                reference: this.getFlag("dnd5e", "originalActor")
                }));
                return;
            }
            const prototypeTokenData = await baseActor.getTokenDocument();
            const actorData = this.token.get.getFlag("dnd5e", "previousActorData");
            const tokenUpdate = this.token.toObject();
            tokenUpdate.actorData = actorData ? actorData : {};

            for ( const k of ["width", "height", "alpha", "lockRotation", "name"] ) {
                tokenUpdate[k] = prototypeTokenData[k];
            }
            for ( const k of ["offsetX", "offsetY", "scaleX", "scaleY", "src", "tint"] ) {
                tokenUpdate.texture[k] = prototypeTokenData.texture[k];
            }
            tokenUpdate.sight = prototypeTokenData.sight;
            tokenUpdate.detectionModes = prototypeTokenData.detectionModes;

            await this.sheet.close();
            await canvas.scene?.deleteEmbeddedDocuments("Token", [this.token._id]);
            const token = await TokenDocument.implementation.create(tokenUpdate, {
                parent: canvas.scene, keepId: true, render: true
            });
            const actor = results.find(r => r._id === tokenUpdate._id).actor;
            if ( isOriginalActor ) {
                await this.unsetFlag("dnd5e", "isPolymorphed");
                await this.unsetFlag("dnd5e", "previousActorIds");
            }
            if ( isRendered && renderSheet ) token.actor.sheet?.render(true);
            return token;
            }
        */
        if (!original) {
            if (!previousOriginalActorTokenData) {
                warn(game.i18n.format(`${CONSTANTS.MODULE_NAME}.polymorphRevertNoOriginalActorWarn`, {
                    reference: (sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR)),
                }), true);
                return undefined;
            }
        }
        const isRendered = sourceActor.sheet?.rendered;
        if (isRendered) {
            sourceActor.sheet?.close();
        }
        try {
            if (useWarpGate) {
                // =============================================
                // THIS IS THE SOLUTION WITH WARP GATE (AVOID THE CREATION OF ACTOR)
                // ===========================================
                let arrayMutationNames = (sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT));
                if (!arrayMutationNames || arrayMutationNames.length == 0) {
                    arrayMutationNames = [];
                    warn(`Array mutation names for the revert is null or empty`);
                }
                if (arrayMutationNames.length > 0) {
                    for (const revertName of arrayMutationNames) {
                        info(`${sourceToken.actor?.name} reverts to their original form`);
                        // TODO show on chat ?
                        //await ChatMessage.create({content: `${actor.name} reverts to their original form`, speaker:{alias: actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
                        //@ts-ignore
                        await warpgate.revert(sourceToken.document, revertName);
                    }
                }
                else {
                    //@ts-ignore
                    await warpgate.revert(sourceToken.document, "");
                }
            }
            else {
                // =============================================
                // THIS IS THE DND5E SOLUTION WITh THE CREATION OF ACTOR)
                // ===========================================
                // Get the Tokens which represent this actor
                if (canvas.ready) {
                    const tokens = sourceActor.getActiveTokens(true);
                    //@ts-ignore
                    const tokenData = await original.getTokenDocument();
                    const tokenUpdates = tokens.map((t) => {
                        const update = duplicate(tokenData);
                        update._id = t.id;
                        //@ts-ignore
                        delete update.x;
                        //@ts-ignore
                        delete update.y;
                        return update;
                    });
                    await canvas.scene?.updateEmbeddedDocuments("Token", tokenUpdates);
                }
                else if (previousOriginalActorTokenData) {
                    const tokenData = previousOriginalActorTokenData;
                    const update = duplicate(tokenData);
                    //@ts-ignore
                    delete update.x;
                    //@ts-ignore
                    delete update.y;
                    await canvas.scene?.updateEmbeddedDocuments("Token", [update]);
                }
                // Delete the polymorphed version of the actor, if possible
                if (!game.settings.get(CONSTANTS.MODULE_NAME, "doNotDeleteTmpActors")) {
                    const idsToDelete = [];
                    idsToDelete.push(sourceActor.id);
                    const othersActorsToDelete = (sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR));
                    if (othersActorsToDelete &&
                        Array.isArray(othersActorsToDelete) &&
                        othersActorsToDelete.length > 0) {
                        othersActorsToDelete.reverse();
                        for (const td of othersActorsToDelete) {
                            if (
                            //@ts-ignore
                            td.actorId &&
                                //@ts-ignore
                                !idsToDelete.includes(td.actorId) &&
                                //@ts-ignore
                                td.actorId != original.id &&
                                //@ts-ignore
                                game.actors?.get(td.actorId)) {
                                //@ts-ignore
                                idsToDelete.push(td.actorId);
                            }
                        }
                    }
                    else {
                        warn(`Invoked the revert to original, but no flag '${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}' is been found or is empty`);
                    }
                    if (idsToDelete.length > 0) {
                        const idsActorToDelete = [];
                        for (const id of idsToDelete) {
                            const actorToDelete = game.actors?.get(id);
                            if (actorToDelete) {
                                info(`Delete actor polymorphed ${actorToDelete.name}|${actorToDelete.id}`);
                                // await actorToDelete.delete();
                                if (!idsActorToDelete.includes(actorToDelete.id)) {
                                    idsActorToDelete.push(actorToDelete.id);
                                }
                            }
                        }
                        // await Actor.deleteDocuments(idsActorToDelete);
                        //@ts-ignore
                        await Actor.implementation.deleteDocuments(idsActorToDelete);
                    }
                }
            }
        }
        finally {
            if (original && hasProperty(original, `flags.${CONSTANTS.MODULE_NAME}`)) {
                await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
                await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
                await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
                await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);
                for (const token of original.getActiveTokens()) {
                    if (token.actor) {
                        if (token.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED) != undefined) {
                            await token.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
                        }
                        if (token.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR) != undefined) {
                            await token.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
                        }
                        if (token.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT) !=
                            undefined) {
                            await token.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
                        }
                        if (token.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR) != undefined) {
                            await token.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);
                        }
                    }
                }
            }
        }
        if (isRendered && renderSheet) {
            original.sheet?.render(isRendered);
        }
        return original;
    },
    async renderDialogTransformOptions(sourceToken, sourceActor, targetActor, explicitName, animation) {
        //@ts-ignore
        const tokenUpdatesToTransform = await targetActor.getTokenDocument();
        // Define a function to record polymorph settings for future use
        const rememberOptions = (html) => {
            const options = {};
            html.find("input[type=checkbox]").each((i, el) => {
                options[el.name] = el.checked;
            });
            html.find("input#explicitName").each((i, el) => {
                options["explicitName"] = el.value;
            });
            //const settings = mergeObject(game.settings.get(CONSTANTS.MODULE_NAME, "polymorphSettings") || {}, options);
            //game.settings.set(CONSTANTS.MODULE_NAME, 'polymorphSettings', settings);
            // TODO findd a way to sav the custom settings on client side
            const settings = mergeObject(this.polymorphSettings || {}, options);
            return settings;
        };
        const i18nPolymorphSettingsTmp = {};
        for (const key in this.i18nPolymorphSettings) {
            const value = i18n(this.i18nPolymorphSettings[key]);
            i18nPolymorphSettingsTmp[key] = value;
        }
        const i18nPolymorphEffectSettingsTmp = {};
        for (const key in this.i18nPolymorphEffectSettings) {
            const value = i18n(this.i18nPolymorphEffectSettings[key]);
            i18nPolymorphEffectSettingsTmp[key] = value;
        }
        // Create and render the Dialog
        return new Dialog({
            title: i18n(`${CONSTANTS.MODULE_NAME}.polymorphPromptTitle`),
            //@ts-ignore
            content: {
                options: this.polymorphSettings,
                i18n: i18nPolymorphSettingsTmp,
                settings: i18nPolymorphSettingsTmp,
                effectSettings: i18nPolymorphEffectSettingsTmp,
                isToken: sourceActor.isToken,
                targetActorName: explicitName ?? targetActor.name,
            },
            default: "accept",
            buttons: {
                accept: {
                    icon: '<i class="fas fa-check"></i>',
                    label: i18n(`${CONSTANTS.MODULE_NAME}.polymorphAcceptSettings`),
                    callback: async (html) => {
                        if (sourceToken) {
                            if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
                                game.macros
                                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                                    //@ts-ignore
                                    ?.execute(sourceToken, tokenUpdatesToTransform);
                            }
                            else {
                                ANIMATIONS.animationFunctions[animation].fn(sourceToken, tokenUpdatesToTransform);
                            }
                            await wait(ANIMATIONS.animationFunctions[animation].time);
                        }
                        info(`${sourceActor.name} turns into a ${targetActor.name}`);
                        // TODO show on chat ?
                        //await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
                        await this.transformInto(sourceToken, sourceActor, targetActor, rememberOptions(html), false, game.user?.id);
                    },
                },
                wildshape: {
                    icon: transformationPresets.wildshape.icon,
                    label: i18n(transformationPresets.wildshape.label),
                    callback: async (html) => {
                        if (sourceToken) {
                            if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
                                game.macros
                                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                                    //@ts-ignore
                                    ?.execute(sourceToken, tokenUpdatesToTransform);
                            }
                            else {
                                ANIMATIONS.animationFunctions[animation].fn(sourceToken, tokenUpdatesToTransform);
                            }
                            await wait(ANIMATIONS.animationFunctions[animation].time);
                        }
                        info(`${sourceActor.name} turns into a ${targetActor.name}`);
                        // TODO show on chat ?
                        //await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
                        //@ts-ignore
                        await this.transformInto(sourceToken, sourceActor, targetActor, foundry.utils.mergeObject(transformationPresets.wildshape.options, {
                            transformTokens: rememberOptions(html).transformTokens,
                            // keepAE: rememberOptions(html).keepAE,
                            // //removeAE: rememberOptions(html).removeAE,
                            // removeOriginAE: rememberOptions(html).removeOriginAE,
                            // removeOtherOriginAE: rememberOptions(html).removeOtherOriginAE,
                            // removeFeatAE: rememberOptions(html).removeFeatAE,
                            // removeSpellAE: rememberOptions(html).removeSpellAE,
                            // removeEquipmentAE: rememberOptions(html).removeEquipmentAE,
                            // removeClassAE: rememberOptions(html).removeClassAE,
                            // removeBackgroundAE: rememberOptions(html).removeBackgroundAE,
                        }), false, game.user?.id);
                    },
                },
                polymorph: {
                    icon: transformationPresets.polymorph.icon,
                    label: i18n(transformationPresets.polymorph.label),
                    callback: async (html) => {
                        if (sourceToken) {
                            if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
                                game.macros
                                    ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                                    //@ts-ignore
                                    ?.execute(sourceToken, tokenUpdatesToTransform);
                            }
                            else {
                                ANIMATIONS.animationFunctions[animation].fn(sourceToken, tokenUpdatesToTransform);
                            }
                            await wait(ANIMATIONS.animationFunctions[animation].time);
                        }
                        info(`${sourceActor.name} turns into a ${targetActor.name}`);
                        // TODO show on chat ?
                        //await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
                        //@ts-ignore
                        await this.transformInto(sourceToken, sourceActor, targetActor, foundry.utils.mergeObject(transformationPresets.polymorph.options, {
                            transformTokens: rememberOptions(html).transformTokens,
                            // keepAE: rememberOptions(html).keepAE,
                            // //removeAE: rememberOptions(html).removeAE,
                            // removeOriginAE: rememberOptions(html).removeOriginAE,
                            // removeOtherOriginAE: rememberOptions(html).removeOtherOriginAE,
                            // removeFeatAE: rememberOptions(html).removeFeatAE,
                            // removeSpellAE: rememberOptions(html).removeSpellAE,
                            // removeEquipmentAE: rememberOptions(html).removeEquipmentAE,
                            // removeClassAE: rememberOptions(html).removeClassAE,
                            // removeBackgroundAE: rememberOptions(html).removeBackgroundAE,
                        }), false, game.user?.id);
                    },
                },
                self: {
                    icon: transformationPresets.polymorphSelf.icon,
                    label: i18n(transformationPresets.polymorphSelf.label),
                    callback: async (html) => {
                        this.transformInto(sourceToken, sourceActor, targetActor, foundry.utils.mergeObject(transformationPresets.polymorphSelf.options, {
                            transformTokens: rememberOptions(html).transformTokens,
                            // keepAE: rememberOptions(html).keepAE,
                            // //removeAE: rememberOptions(html).removeAE,
                            // removeOriginAE: rememberOptions(html).removeOriginAE,
                            // removeOtherOriginAE: rememberOptions(html).removeOtherOriginAE,
                            // removeFeatAE: rememberOptions(html).removeFeatAE,
                            // removeSpellAE: rememberOptions(html).removeSpellAE,
                            // removeEquipmentAE: rememberOptions(html).removeEquipmentAE,
                            // removeClassAE: rememberOptions(html).removeClassAE,
                            // removeBackgroundAE: rememberOptions(html).removeBackgroundAE,
                        }), false, game.user?.id);
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: i18n("Cancel"),
                },
            },
        }, {
            classes: ["dialog", `${CONSTANTS.MODULE_NAME}`],
            width: 900,
            template: `modules/${CONSTANTS.MODULE_NAME}/templates/polymorph-prompt.hbs`,
        });
    },
    async prepareDataFromTransformOptions(originalActorData, targetActorData, sourceEffects, targetActorImages, transformOptions) {
        const keepPhysical = transformOptions?.keepPhysical || false;
        const keepMental = transformOptions?.keepMental || false;
        const keepSaves = transformOptions?.keepSaves || false;
        const keepSkills = transformOptions?.keepSkills || false;
        const mergeSaves = transformOptions?.mergeSaves || false;
        const mergeSkills = transformOptions?.mergeSkills || false;
        const keepClass = transformOptions?.keepClass || false;
        const keepFeats = transformOptions?.keepFeats || false;
        const keepSpells = transformOptions?.keepSpells || false;
        const keepItems = transformOptions?.keepItems || false;
        const keepBio = transformOptions?.keepBio || false;
        const keepVision = transformOptions?.keepVision || false;
        const keepSelf = transformOptions?.keepSelf || false;
        const keepAE = transformOptions?.keepAE || false;
        // const removeAE = transformOptions?.removeAE || false;
        // const keepAEOnlyOriginNotEquipment = transformOptions?.keepAEOnlyOriginNotEquipment || false;
        const keepOriginAE = transformOptions?.keepOriginAE || true;
        const keepOtherOriginAE = transformOptions?.keepOtherOriginAE || true;
        const keepSpellAE = transformOptions?.keepSpellAE || true;
        const keepEquipmentAE = transformOptions?.keepEquipmentAE || true;
        const keepFeatAE = transformOptions?.keepFeatAE || true;
        const keepClassAE = transformOptions?.keepClassAE || true;
        const keepBackgroundAE = transformOptions?.keepBackgroundAE || true;
        //
        const transformTokens = transformOptions?.transformTokens || true;
        const explicitName = transformOptions?.explicitName || "";
        // const renderSheet = transformOptions?.renderSheet || true;
        // Get the original Actor data and the new source data
        // const originalActorData = <any>sourceActor.toJSON();
        //originalActorData.flags.dnd5e = originalActorData.flags.dnd5e || {};
        //originalActorData.flags.dnd5e.transformOptions = {mergeSkills, mergeSaves};
        if (!getProperty(originalActorData.flags, `${CONSTANTS.MODULE_NAME}`)) {
            setProperty(originalActorData.flags, `${CONSTANTS.MODULE_NAME}`, {});
        }
        setProperty(originalActorData.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.TRANSFORMER_OPTIONS}`, {
            keepPhysical,
            keepMental,
            keepSaves,
            keepSkills,
            mergeSaves,
            mergeSkills,
            keepClass,
            keepFeats,
            keepSpells,
            keepItems,
            keepBio,
            keepVision,
            keepSelf,
            keepAE,
            // removeAE,
            // keepAEOnlyOriginNotEquipment,
            keepOriginAE,
            keepOtherOriginAE,
            keepSpellAE,
            keepEquipmentAE,
            keepFeatAE,
            keepClassAE,
            keepBackgroundAE,
            //
            transformTokens,
            explicitName,
        });
        /**
         * dnd5e: npc and character are nearly interchangable.
         * If we dont switch the type, we dont have to fool
         * with the sheet app caching, but for other system can be useful...
         */
        // delete targetActorData.type;
        // =====================================
        // START SPECIFIC MANAGEMENT FOR SYSTEM
        // =====================================
        // Prepare data effect
        const newEffectsOri = (sourceEffects ? sourceEffects : originalActorData.effects) || [];
        const newEffects = [];
        for (const effect of newEffectsOri) {
            let originS = "";
            let effectS = undefined;
            if (effect.value && Object.prototype.hasOwnProperty.call(effect.value, "origin")) {
                originS = effect.value.origin;
                effectS = effect.value;
            }
            else if (effect && Object.prototype.hasOwnProperty.call(effect, "origin")) {
                originS = effect.origin;
                effectS = effect;
            }
            else if (effect.origin && Object.prototype.hasOwnProperty.call(effect, "origin")) {
                originS = effect.origin;
                effectS = effect;
            }
            if (effectS) {
                newEffects.push(effectS);
            }
        }
        // Prepare new data to merge from the source
        let d = foundry.utils.mergeObject({
            type: originalActorData.type,
            name: explicitName ? explicitName : `${originalActorData.name} (${targetActorData.name})`,
            //@ts-ignore
            system: keepSelf ? originalActorData.system : targetActorData.system,
            items: keepSelf ? originalActorData.items : targetActorData.items,
            effects: keepSelf
                ? newEffects
                : targetActorData.effects
                    ? newEffects.concat(targetActorData.effects)
                    : newEffects,
            //@ts-ignore
            // effects: targetActorData.effects ? originalActorData.effects.concat(targetActorData.effects) : originalActorData.effects,
            img: targetActorData.img,
            // permission: originalActorData.permission, // Use the original actor permissions
            //@ts-ignore
            ownership: originalActorData.ownership,
            folder: originalActorData.folder,
            flags: originalActorData.flags,
            prototypeToken: {
                name: `${originalActorData.name} (${targetActorData.name})`,
                texture: {},
                sight: {},
                detectionModes: [],
            },
            //@ts-ignore
            width: targetActorData.prototypeToken.width,
            //@ts-ignore
            height: targetActorData.prototypeToken.height,
            // scale: targetActorData.prototypeToken.scale,
            texture: {
                //@ts-ignore
                scaleX: targetActorData.prototypeToken.texture.scaleX,
                //@ts-ignore
                scaleY: targetActorData.prototypeToken.texture.scaleY,
            },
        }, keepSelf ? originalActorData : {}); // Keeps most of original actor
        // Specifically delete some data attributes
        //@ts-ignore
        delete d.system.resources; // Don't change your resource pools
        //@ts-ignore
        delete d.system.currency; // Don't lose currency
        //@ts-ignore
        delete d.system.bonuses; // Don't lose global bonuses
        // Specific additional adjustments
        //@ts-ignore
        if (originalActorData.system.details?.alignment) {
            //@ts-ignore
            d.system.details.alignment = originalActorData.system.details.alignment; // Don't change alignment
        }
        //@ts-ignore
        if (originalActorData.system.attributes.exhaustion) {
            //@ts-ignore
            d.system.attributes.exhaustion = originalActorData.system.attributes.exhaustion; // Keep your prior exhaustion level
        }
        //@ts-ignore
        if (originalActorData.system.attributes.inspiration) {
            //@ts-ignore
            d.system.attributes.inspiration = originalActorData.system.attributes.inspiration; // Keep inspiration
        }
        //@ts-ignore
        if (originalActorData.system.spells) {
            //@ts-ignore
            d.system.spells = originalActorData.system.spells; // Keep spell slots
        }
        //@ts-ignore
        if (targetActorData.system.attributes.ac) {
            //@ts-ignore
            // d.system.attributes.ac.flat = targetActorData.system.attributes.ac.value; // Override AC
            d.system.attributes.ac = targetActorData.system.attributes.ac;
        }
        //@ts-ignore
        // const vision = keepVision ? originalActorData.prototypeToken : targetActorData.prototypeToken;
        // for (const k of ["dimSight", "brightSight", "dimLight", "brightLight", "vision", "sightAngle"]) {
        // 	d.prototypeToken[k] = vision[k];
        // }
        // Token appearance updates
        // if (!hasProperty(d, "prototypeToken.texture.src")) {
        // 	//@ts-ignore
        // 	d.prototypeToken = { name: d.name, texture: {}, sight: {}, detectionModes: [] };
        // }
        for (const k of ["width", "height", "alpha", "lockRotation"]) {
            //@ts-ignore
            d.prototypeToken[k] = targetActorData.prototypeToken[k];
        }
        for (const k of ["offsetX", "offsetY", "scaleX", "scaleY", "src", "tint"]) {
            //@ts-ignore
            d.prototypeToken.texture[k] = targetActorData.prototypeToken.texture[k];
        }
        for (const k of ["bar1", "bar2", "displayBars", "displayName", "disposition", "rotation", "elevation"]) {
            //@ts-ignore
            d.prototypeToken.texture[k] = originalActorData.prototypeToken.texture[k];
        }
        if (!keepSelf) {
            //@ts-ignore
            const sightSource = keepVision ? originalActorData.prototypeToken : targetActorData.prototypeToken;
            for (const k of [
                "range",
                "angle",
                "visionMode",
                "color",
                "attenuation",
                "brightness",
                "saturation",
                "contrast",
                "enabled",
            ]) {
                //@ts-ignore
                d.prototypeToken.sight[k] = sightSource.sight[k];
            }
            //@ts-ignore
            d.prototypeToken.detectionModes = sightSource.detectionModes;
            // Transfer ability scores
            if (
            //@ts-ignore
            originalActorData.system.abilities &&
                //@ts-ignore
                (originalActorData.system.abilities.length > 0 || originalActorData.system.abilities.size > 0)) {
                //@ts-ignore
                const abilities = d.system.abilities;
                for (const k of Object.keys(abilities)) {
                    //@ts-ignore
                    const oa = originalActorData.system.abilities[k];
                    const prof = abilities[k].proficient;
                    if (keepPhysical && ["str", "dex", "con"].includes(k))
                        abilities[k] = oa;
                    else if (keepMental && ["int", "wis", "cha"].includes(k))
                        abilities[k] = oa;
                    if (keepSaves)
                        abilities[k].proficient = oa.proficient;
                    else if (mergeSaves)
                        abilities[k].proficient = Math.max(prof, oa.proficient);
                }
            }
            // Transfer skills
            //@ts-ignore
            if (
            //@ts-ignore
            originalActorData.system.skills &&
                //@ts-ignore
                (originalActorData.system.skills.length > 0 || originalActorData.system.skills.size > 0)) {
                if (keepSkills) {
                    //@ts-ignore
                    d.system.skills = originalActorData.system.skills;
                }
                else if (mergeSkills) {
                    if (d.system.skills && (d.system.skills.length > 0 || d.system.skills.size > 0)) {
                        // eslint-disable-next-line prefer-const
                        for (let [k, s] of Object.entries(d.system.skills)) {
                            //@ts-ignore
                            s.value = Math.max(s.value, originalActorData.system.skills[k].value);
                        }
                    }
                }
            }
            // Keep specific items from the original data
            //@ts-ignore
            d.items = d.items ? d.items : [];
            if (originalActorData.items && originalActorData.items.size > 0) {
                //@ts-ignore
                d.items = d.items.concat(originalActorData.items.filter((i) => {
                    if (["class", "subclass"].includes(i.type)) {
                        return keepClass;
                    }
                    else if (i.type === "feat") {
                        return keepFeats;
                    }
                    else if (i.type === "spell") {
                        return keepSpells;
                    }
                    else {
                        return keepItems;
                    }
                }));
            }
            // Transfer classes for NPCs
            if (!keepClass && d.system.details.cr) {
                //@ts-ignore
                d.items.push({
                    type: "class",
                    name: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphTmpClass`),
                    data: { levels: d.system.details.cr },
                });
            }
            // Keep biography
            //@ts-ignore
            if (originalActorData.system.details.biography) {
                if (keepBio) {
                    //@ts-ignore
                    d.system.details.biography = originalActorData.system.details.biography;
                }
            }
            // Keep senses
            if (d.system.traits) {
                if (!d.system.traits.senses) {
                    d.system.traits.senses = [];
                }
                else if (typeof d.system.traits.senses === "string" || d.system.traits.senses instanceof String) {
                    d.system.traits.senses = [
                        {
                            value: d.system.traits.senses,
                        },
                    ];
                }
                else if (typeof d.system.traits.senses === "object" &&
                    !Array.isArray(d.system.traits.senses) &&
                    d.system.traits.senses !== null) {
                    d.system.traits.senses = [d.system.traits.senses];
                }
                if (
                //@ts-ignore
                originalActorData.system.traits.senses &&
                    //@ts-ignore
                    (originalActorData.system.traits.senses.length > 0 ||
                        //@ts-ignore
                        originalActorData.system.traits.senses.size > 0)) {
                    if (keepVision) {
                        //@ts-ignore
                        d.system.traits.senses = originalActorData.system.traits.senses;
                    }
                }
            }
            // Remove active effects
            const oEffects = foundry.utils.deepClone(d.effects);
            const originEffectIds = new Set(oEffects
                .filter((effect) => {
                return !effect.origin || effect.origin === this.uuid;
            })
                .map((e) => e._id));
            d.effects = d.effects.filter((e) => {
                if (keepAE) {
                    return true;
                }
                const origin = 
                //@ts-ignore
                e.origin?.startsWith("Actor") || e.origin?.startsWith("Item") ? fromUuidSync(e.origin) : {};
                const originIsSelf = origin?.parent?.uuid === this.uuid;
                const isOriginEffect = originEffectIds.has(e._id);
                if (isOriginEffect) {
                    return keepOriginAE;
                }
                if (!isOriginEffect && !originIsSelf) {
                    return keepOtherOriginAE;
                }
                if (origin.type === "spell") {
                    return keepSpellAE;
                }
                if (origin.type === "feat") {
                    return keepFeatAE;
                }
                if (origin.type === "background") {
                    return keepBackgroundAE;
                }
                if (["subclass", "feat"].includes(origin.type)) {
                    return keepClassAE;
                }
                if (["equipment", "weapon", "tool", "loot", "backpack"].includes(origin.type)) {
                    return keepEquipmentAE;
                }
                return true;
            });
        }
        //@ts-ignore
        if (targetActorData.prototypeToken.randomImg) {
            // const images = await target.getTokenImages();
            const images = targetActorImages;
            //@ts-ignore
            d.prototypeToken.texture.src = images[Math.floor(Math.random() * images.length)];
        }
        // Strange bug with fvtt10
        const tokenEffectsCleaned = [];
        for (const effect of d.effects) {
            let effectTmp = undefined;
            try {
                effectTmp = effect.toObject(false);
            }
            catch (e) {
                effectTmp = effect.toJSON();
            }
            //@ts-ignore
            delete effectTmp._id;
            tokenEffectsCleaned.push(effectTmp);
        }
        d.effects = tokenEffectsCleaned;
        // =====================================
        // END SPECIFIC MANAGEMENT FOR SYSTEM
        // =====================================
        return d;
    },
};
