import { ANIMATIONS } from "./animations.js";
import { PolymorpherFlags, } from "./automatedPolymorpherModels.js";
import CONSTANTS from "./constants.js";
import { error, info, isEmptyObject, retrieveActorFromData, retrieveActorFromToken, transferPermissionsActorInner, wait, warn, } from "./lib/lib.js";
import { PolymorpherManager } from "./polymorphermanager.js";
import { automatedPolymorpherSocket } from "./socket.js";
import D35E from "./systems/D35E.js";
import dnd5e from "./systems/dnd5e.js";
import generic from "./systems/generic.js";
import pf1 from "./systems/pf1.js";
import pf2e from "./systems/pf2e.js";
import swade from "./systems/swade.js";
const API = {
    async invokePolymorpherManagerFromActorArr(...inAttributes) {
        if (!Array.isArray(inAttributes)) {
            throw error("invokePolymorpherManagerFromActorArr | inAttributes must be of type array");
        }
        const [sourceActorIdOrName, removePolymorpher, ordered, random, animationExternal, cloneFlags] = inAttributes;
        const result = await this.invokePolymorpherManagerFromActor(sourceActorIdOrName, removePolymorpher, ordered, random, animationExternal);
        return result;
    },
    async invokePolymorpherManagerFromActor(sourceActorIdOrName, removePolymorpher = false, ordered = false, random = false, animationExternal = undefined) {
        for (const tokenOnCanvas of canvas.tokens?.placeables) {
            const actor = retrieveActorFromToken(tokenOnCanvas);
            if (actor && (actor.id === sourceActorIdOrName || actor.name === sourceActorIdOrName)) {
                await this._invokePolymorpherManagerInner(tokenOnCanvas, actor, removePolymorpher, ordered, random, animationExternal);
                break;
            }
        }
    },
    async invokePolymorpherManagerArr(...inAttributes) {
        if (!Array.isArray(inAttributes)) {
            throw error("invokePolymorpherManagerArr | inAttributes must be of type array");
        }
        const [sourceTokenIdOrName, removePolymorpher, ordered, random, animationExternal, cloneFlags] = inAttributes;
        const result = await this.invokePolymorpherManager(sourceTokenIdOrName, removePolymorpher, ordered, random, animationExternal);
        return result;
    },
    async invokePolymorpherManager(sourceTokenIdOrName, removePolymorpher = false, ordered = false, random = false, animationExternal = undefined) {
        const sourceToken = canvas.tokens?.placeables.find((t) => {
            return t.id === sourceTokenIdOrName || t.name === sourceTokenIdOrName;
        });
        if (!sourceToken) {
            warn(`No token founded on canvas with id/name '${sourceTokenIdOrName}'`, true);
            return;
        }
        const sourceActor = retrieveActorFromToken(sourceToken);
        if (!sourceActor) {
            warn(`No actor founded for the token with id/name '${sourceTokenIdOrName}'`, true);
            return;
        }
        await this._invokePolymorpherManagerInner(sourceToken, sourceActor, removePolymorpher, ordered, random, animationExternal);
    },
    async _invokePolymorpherManagerInner(currentToken, currentActor, removePolymorpher, ordered, random, animationExternal = undefined) {
        const listPolymorphers = currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];
        let isOrdered = ordered;
        let isRandom = random;
        if (!ordered && currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED)) {
            isOrdered = currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED) ?? false;
        }
        if (!random && currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM)) {
            isRandom = currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM) ?? false;
        }
        // TODO find a better method than this
        let lastElement = "";
        const matches = currentToken.name.match(/(?<=\().+?(?=\))/g);
        if (matches && matches.length > 0) {
            lastElement = matches[matches.length - 1];
        }
        else {
            lastElement = currentToken.name;
        }
        if (removePolymorpher) {
            // =====================================
            // REVERT TO ORIGINAL FORM
            // =====================================
            const updatesForRevert = (currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR));
            if (!updatesForRevert || updatesForRevert.length <= 0) {
                await currentActor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
                await currentActor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
                warn(`Can't revert this token without the flag '${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}'`, true);
                return;
            }
            const polyData = listPolymorphers.find((a) => {
                return (lastElement.toLowerCase().includes(a.name.toLowerCase()) ||
                    (a.explicitname && lastElement.toLowerCase().includes(a.explicitname.toLowerCase())));
            });
            const polyDataIndex = listPolymorphers.findIndex((a) => {
                return (lastElement.toLowerCase().includes(a.name.toLowerCase()) ||
                    (a.explicitname && lastElement.toLowerCase().includes(a.explicitname.toLowerCase())));
            });
            const animation = polyData?.animation;
            //@ts-ignore
            const tokenDataToTransform = await currentActor.getTokenDocument();
            const tokenFromTransform = canvas.tokens?.placeables.find((t) => {
                return t.actor?.id === currentActor.id;
            }) || tokenDataToTransform;
            if (animationExternal && animationExternal.sequence) {
                //@ts-ignore
                await animationExternal.sequence.play();
                await wait(animationExternal.timeToWait);
            }
            else if (animation) {
                if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
                    //@ts-ignore
                    game.macros
                        ?.getName(ANIMATIONS.animationFunctions[animation].fn)
                        //@ts-ignore
                        ?.execute({ tokenFromTransform, tokenDataToTransform });
                }
                else {
                    ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
                }
                await wait(ANIMATIONS.animationFunctions[animation].time);
            }
            // Do something with left click
            info(`${currentActor.name} reverts to their original form`);
            // TODO show on chat ?
            //await ChatMessage.create({content: `${actor.name} reverts to their original form`, speaker:{alias: actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
            const actorOriginalId = await this.revertOriginalForm(currentToken, currentActor, false);
            if (!actorOriginalId) {
                warn(`NO actor id returned from revert polymorph action. Check out the logs`, true);
                return;
            }
            const actorOriginal = game.actors?.get(actorOriginalId);
            if (!actorOriginal) {
                warn(`NO actor returned from revert polymorph action with id ${actorOriginalId}. Check out the logs`, true);
                return;
            }
        }
        else {
            // ================================
            // TRANSFORM INTO
            // ================================
            if (isRandom && isOrdered) {
                warn(`Attention you can't enable the 'ordered' and the 'random' both at the same time`);
                return;
            }
            if (isRandom) {
                if (listPolymorphers?.length === 1) {
                    new PolymorpherManager(currentActor, currentToken).fastSummonPolymorpher(listPolymorphers[0], animationExternal);
                }
                else {
                    const polyDataIndex = listPolymorphers.findIndex((a) => {
                        return (lastElement.toLowerCase().includes(a.name.toLowerCase()) ||
                            (a.explicitname && lastElement.toLowerCase().includes(a.explicitname.toLowerCase())));
                    });
                    let randomIndex = 0;
                    while (randomIndex === polyDataIndex) {
                        randomIndex = Math.floor(Math.random() * listPolymorphers.length);
                    }
                    new PolymorpherManager(currentActor, currentToken).fastSummonPolymorpher(listPolymorphers[randomIndex], animationExternal);
                }
            }
            else if (isOrdered) {
                const polyDataIndex = listPolymorphers.findIndex((a) => {
                    return (lastElement.toLowerCase().includes(a.name.toLowerCase()) ||
                        (a.explicitname && lastElement.toLowerCase().includes(a.explicitname.toLowerCase())));
                });
                const nextIndex = polyDataIndex + 1;
                if (listPolymorphers?.length - 1 < nextIndex) {
                    new PolymorpherManager(currentActor, currentToken).fastSummonPolymorpher(listPolymorphers[0], animationExternal);
                }
                else {
                    new PolymorpherManager(currentActor, currentToken).fastSummonPolymorpher(listPolymorphers[nextIndex], animationExternal);
                }
            }
            else {
                new PolymorpherManager(currentActor, currentToken).render(true);
            }
        }
    },
    async cleanUpTokenSelectedArr(...inAttributes) {
        const result = await this.cleanUpTokenSelected();
        return result;
    },
    async cleanUpTokenSelected() {
        const tokens = canvas.tokens?.controlled;
        if (!tokens || tokens.length === 0) {
            warn(`No tokens are selected`, true);
            return;
        }
        for (const token of tokens) {
            if (token && token.actor) {
                if (getProperty(token.actor, `flags.${CONSTANTS.MODULE_NAME}`)) {
                    const p = getProperty(token.actor, `flags.${CONSTANTS.MODULE_NAME}`);
                    for (const key in p) {
                        const senseOrConditionIdKey = key;
                        const senseOrConditionValue = p[key];
                        await token.actor.unsetFlag(CONSTANTS.MODULE_NAME, senseOrConditionIdKey);
                    }
                    info(`Cleaned up token '${token.name}'`, true);
                }
            }
            else {
                warn(`No token found on the canvas for id '${token.id}'`, true);
            }
        }
        for (const token of tokens) {
            if (token && token.actor) {
                if (getProperty(token.actor, `flags.${CONSTANTS.MODULE_NAME}`)) {
                    const p = getProperty(token.actor, `flags.${CONSTANTS.MODULE_NAME}`);
                    for (const key in p) {
                        const senseOrConditionIdKey = key;
                        const senseOrConditionValue = p[key];
                        await token.actor.unsetFlag(CONSTANTS.MODULE_NAME, senseOrConditionIdKey);
                    }
                    info(`Cleaned up actor '${token.name}'`, true);
                }
            }
            else {
                warn(`No token found on the canvas for id '${token.id}'`, true);
            }
        }
    },
    async retrieveAndPrepareActorArr(...inAttributes) {
        if (!Array.isArray(inAttributes)) {
            throw error("retrieveAndPrepareActorArr | inAttributes must be of type array");
        }
        const [aUuid, aId, aName, currentCompendium, createOnWorld, sourceActorId, userId, cloneFlags] = inAttributes;
        const result = await this.retrieveAndPrepareActor(aUuid, aId, aName, currentCompendium, createOnWorld, sourceActorId, userId);
        return result.id;
    },
    async retrieveAndPrepareActor(aUuid, aId, aName, currentCompendium, createOnWorld, sourceActorId, userId) {
        const targetActor = await retrieveActorFromData(aUuid, aId, aName, currentCompendium, createOnWorld);
        const sourceActor = await retrieveActorFromData(aUuid, sourceActorId, undefined, undefined, false);
        const user = game.users?.get(userId);
        if (!user.isGM && game.user?.isGM) {
            if (sourceActor && targetActor) {
                transferPermissionsActorInner(sourceActor, targetActor, user.id);
            }
        }
        return targetActor;
    },
    get polymorphSetting() {
        return game.settings.get(CONSTANTS.MODULE_NAME, "polymorphSetting");
    },
    async transformIntoArr(...inAttributes) {
        if (!Array.isArray(inAttributes)) {
            throw error("transformIntoArr | inAttributes must be of type array");
        }
        const [sourceTokenId, sourceActorId, sourceActorName, targetActorId, targetActorName, transformOptions, renderSheet, externalUserId, cloneFlags,] = inAttributes;
        const sourceToken = canvas.tokens?.placeables.find((t) => {
            return t.id === sourceTokenId;
        });
        if (!sourceToken) {
            warn(`No source token found with reference '${sourceTokenId}'`, true);
            return undefined;
        }
        let sourceActor = retrieveActorFromToken(sourceToken);
        if (
        //@ts-ignore
        !hasProperty(sourceActor.flags, CONSTANTS.MODULE_NAME) ||
            //@ts-ignore
            isEmptyObject(getProperty(sourceActor.flags, CONSTANTS.MODULE_NAME))) {
            sourceActor = await retrieveActorFromData(undefined, sourceActorId, "", "", false);
        }
        if (!sourceActor) {
            warn(`No source actor found with reference '${sourceTokenId}'`, true);
            return undefined;
        }
        if (cloneFlags) {
            setProperty(sourceActor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
            setProperty(sourceToken?.actor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
        }
        const polymoprhers = sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];
        if (!polymoprhers) {
            warn(`No polymorph flags with id '${PolymorpherFlags.POLYMORPHERS}' is been found!  Usually this happened with unlinked token, sadly you need a linked actor to the token`);
            return undefined;
        }
        const currentPolymorph = polymoprhers.find((p) => {
            return p.id === targetActorId || p.name === targetActorName;
        });
        if (!currentPolymorph) {
            warn(`No polymoprher is been found! Usually this happened with unlinked token, sadly you need a linked actor to the token`);
            return undefined;
        }
        const targetActor = await retrieveActorFromData(currentPolymorph?.uuid, currentPolymorph?.id, currentPolymorph?.name, currentPolymorph?.compendiumid, false);
        if (!targetActor) {
            warn(`No target actor found with reference '${sourceTokenId}'`, true);
            return;
        }
        if (cloneFlags) {
            setProperty(targetActor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
        }
        const something = await this.transformIntoImpl(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId);
        return something;
    },
    async transformInto(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId) {
        const something = await automatedPolymorpherSocket.executeAsGM("transformInto", sourceToken.id, sourceActor.id, sourceActor.name, targetActor.id, targetActor.name, transformOptions, renderSheet, externalUserId);
        return something;
    },
    async revertOriginalFormArr(...inAttributes) {
        if (!Array.isArray(inAttributes)) {
            throw error("revertOriginalFormArr | inAttributes must be of type array");
        }
        const [sourceTokenId, sourceActorId, sourceActorName, renderSheet, cloneFlags] = inAttributes;
        const sourceToken = canvas.tokens?.placeables.find((t) => {
            return t.id === sourceTokenId;
        });
        if (!sourceToken) {
            warn(`No source token found with reference '${sourceTokenId}'`, true);
            return undefined;
        }
        let sourceActor = retrieveActorFromToken(sourceToken);
        if (
        //@ts-ignore
        !hasProperty(sourceActor.flags, CONSTANTS.MODULE_NAME) ||
            //@ts-ignore
            isEmptyObject(getProperty(sourceActor.flags, CONSTANTS.MODULE_NAME))) {
            sourceActor = await retrieveActorFromData(undefined, sourceActorId, "", "", false);
        }
        if (!sourceActor) {
            warn(`No source actor found with reference '${sourceTokenId}'`, true);
            return undefined;
        }
        if (cloneFlags) {
            setProperty(sourceActor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
            setProperty(sourceToken?.actor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
        }
        const originalActor = await this.revertOriginalFormImpl(sourceToken, sourceActor, renderSheet);
        return originalActor?.id;
    },
    async revertOriginalForm(sourceToken, sourceActor, renderSheet) {
        let actorOriginalId = (await automatedPolymorpherSocket.executeAsGM("revertOriginalForm", sourceToken.id, sourceActor.id, sourceActor.name, renderSheet));
        if (!actorOriginalId) {
            warn(`NO actor id returned from revert polymorph action. Check out the logs`, true);
            return undefined;
        }
        const actorOriginal = game.actors?.get(actorOriginalId);
        if (!actorOriginal) {
            warn(`NO actor returned from revert polymorph action with id ${actorOriginalId}. Check out the logs`, true);
            return undefined;
        }
        return actorOriginal?.id;
    },
    async transformIntoImpl(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId) {
        if (!sourceToken) {
            warn(`No source token is been passed`, true);
            return undefined;
        }
        if (!sourceActor) {
            warn(`No source actor is been passed`, true);
            return undefined;
        }
        if (!targetActor) {
            warn(`No target actor is been passed`, true);
            return undefined;
        }
        if (!game.actors?.get(sourceActor.id)) {
            warn(`No source actor is been found`, true);
            return undefined;
        }
        // if(!game.actors?.get(<string>targetActor.id)){
        //   warn(`No target actor is been found`, true);
        //   return;
        // }
        if (game.system.id === "D35E") {
            return await D35E.transformInto(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId);
        }
        else if (game.system.id === "dnd5e") {
            return await dnd5e.transformInto(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId);
        }
        else if (game.system.id === "pf1") {
            return await pf1.transformInto(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId);
        }
        else if (game.system.id === "pf2e") {
            return await pf2e.transformInto(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId);
        }
        else if (game.system.id === "swade") {
            return await swade.transformInto(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId);
        }
        else {
            return await generic.transformInto(sourceToken, sourceActor, targetActor, transformOptions, renderSheet, externalUserId);
        }
    },
    /**
     * If this actor was transformed with transformTokens enabled, then its
     * active tokens need to be returned to their original state. If not, then
     * we can safely just delete this actor.
     * @param {boolean} [renderSheet] Render Sheet after revert the transformation.
     * @returns {Promise<Actor>|null}  Original actor if it was reverted.
     */
    async revertOriginalFormImpl(sourceToken, sourceActor, renderSheet) {
        if (game.system.id === "D35E") {
            return await D35E.revertOriginalForm(sourceToken, sourceActor, renderSheet);
        }
        else if (game.system.id === "dnd5e") {
            return await dnd5e.revertOriginalForm(sourceToken, sourceActor, renderSheet);
        }
        else if (game.system.id === "pf1") {
            return await pf1.revertOriginalForm(sourceToken, sourceActor, renderSheet);
        }
        else if (game.system.id === "pf2e") {
            return await pf2e.revertOriginalForm(sourceToken, sourceActor, renderSheet);
        }
        else if (game.system.id === "swade") {
            return await swade.revertOriginalForm(sourceToken, sourceActor, renderSheet);
        }
        else {
            return await generic.revertOriginalForm(sourceToken, sourceActor, renderSheet);
        }
    },
    async renderDialogTransformOptionsImpl(sourceToken, sourceActor, targetActor, explicitName, animation) {
        if (game.system.id === "D35E") {
            return await D35E.renderDialogTransformOptions(sourceToken, sourceActor, targetActor, explicitName, animation);
        }
        else if (game.system.id === "dnd5e") {
            return await dnd5e.renderDialogTransformOptions(sourceToken, sourceActor, targetActor, explicitName, animation);
        }
        else if (game.system.id === "pf1") {
            return await pf1.renderDialogTransformOptions(sourceToken, sourceActor, targetActor, explicitName, animation);
        }
        else if (game.system.id === "pf2e") {
            return await pf2e.renderDialogTransformOptions(sourceToken, sourceActor, targetActor, explicitName, animation);
        }
        else if (game.system.id === "swade") {
            return await swade.renderDialogTransformOptions(sourceToken, sourceActor, targetActor, explicitName, animation);
        }
        else {
            return await generic.renderDialogTransformOptions(sourceToken, sourceActor, targetActor, explicitName, animation);
        }
    },
};
export default API;
