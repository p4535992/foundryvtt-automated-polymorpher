import { PolymorpherFlags } from "../automatedPolymorpherModels.js";
import CONSTANTS from "../constants.js";
import { warn, error } from "./lib.js";
/**
 * Creates a token so it can be mutated by warpgate
 * @param actor
 * @returns Tokendocument in a 'mutable' state by Warpgate
 */
async function createToken(actor) {
    //@ts-ignore
    const baseToken = await actor.getTokenDocument({ hidden: true });
    return await baseToken.constructor.create(baseToken, { parent: canvas.scene });
}
/**
 * List all polymorphs the actor has done in the past and are succestible to 'warpgate.revert'
 * Getting the information directly from warpgate is less prone to error and simplifies the module
 * @param actor
 * @returns List of mutations the actor has
 */
export function getPolymorphsWithWarpgate(actor) {
    const regex = /poly-automated-polymorpher:.+/;
    const mutations = actor.getFlag("warpgate", "mutate") ?? [];
    return mutations?.filter((mut) => regex.exec(mut.name)) ?? [];
}
/**
 * Gets the active linked tokens of the actor
 * @param actor
 * @returns List of active tokens, linked to the actor
 */
async function getTokens(actor) {
    if (actor.token) {
        return [actor.token];
    }
    const tokens = actor
        .getActiveTokens()
        .map((t) => t.document)
        //@ts-ignore
        .filter((doc) => doc.actorLink);
    if (tokens.length) {
        return tokens;
    }
    return [];
}
/**
 * Reverts a polymorph
 * @param actor
 * @param name Mutation name, if undefined reverts the last mutation
 */
export async function revertPolymorphWithWarpgate(actor, name) {
    const tokens = await getTokens(actor);
    const token = tokens[0] ?? createToken(actor);
    if (name === undefined) {
        const poly = getPolymorphsWithWarpgate(actor);
        const polyObj = poly[poly.length - 1];
        if (!polyObj || !polyObj.name) {
            warn(`Something is wrong, is already reverted`);
            return;
        }
        name = polyObj.name;
    }
    //@ts-ignore
    await warpgate.revert(token, name);
    if (tokens.length === 0) {
        //@ts-ignore
        token.delete();
    }
}
/**
 * Polymorphs an Actor into the targetData
 * @param sourceActorData
 * @param targetActorData
 * @param Data targetData
 * @returns Warpgate Mutation
 */
export async function polymorphWithWarpgate(sourceActor, targetActor, targetTokenDocData) {
    //@ts-ignore
    if (!sourceActor instanceof Actor) {
        throw error(`The sourceActorData must be a Actor object`);
    }
    let sourceActorData = sourceActor;
    //@ts-ignore
    if (sourceActor instanceof Actor) {
        sourceActorData = sourceActor.toObject();
    }
    let targetActorData = targetActor;
    if (targetActor instanceof Actor) {
        // throw error(`The sourceActorData cannot be a Actor object`);
        targetActorData = targetActor.toObject();
    }
    // await sourceActor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED, true);
    // await sourceActor.setFlag(
    // 	CONSTANTS.MODULE_NAME,
    // 	PolymorpherFlags.ORIGINAL_ACTOR,
    // 	getProperty(targetActorData.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
    // );
    let originalActor = (game.actors?.get(sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR)));
    // If no originalActorIsFounded it must be the orginal itself
    if (!originalActor) {
        originalActor = sourceActor;
        setProperty(targetActorData.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, originalActor.id);
    }
    // If the source is an Actor, we create a temporary token, wich will be deleted once warpgate is set
    const tokenDocuments = await getTokens(sourceActor);
    const tokenDocument = tokenDocuments?.[0] ?? createToken(sourceActor);
    const actorData = sourceActorData;
    prepareTargetData(targetActorData);
    if (!targetActorData.flags) {
        targetActorData.flags = {};
    }
    if (!targetActorData.flags[CONSTANTS.MODULE_NAME]) {
        targetActorData.flags[CONSTANTS.MODULE_NAME] = {};
    }
    mergeObject(targetActorData.flags[CONSTANTS.MODULE_NAME], targetTokenDocData.flags[CONSTANTS.MODULE_NAME]);
    if (!targetTokenDocData) {
        warn(`No token data is been passed on the polymorph warpgate method`);
        //@ts-ignore
        targetTokenDocData = targetActorData.prototypeToken;
    }
    const updates = {
        //@ts-ignore
        token: targetActorData.prototypeToken,
        actor: targetActorData,
        embedded: {},
    };
    //@ts-ignore
    for (const [key, value] of Object.entries(Actor.implementation.metadata.embedded)) {
        const metadata = value;
        const embedded = updates.actor[metadata];
        const original = actorData[metadata];
        if (embedded) {
            updates.embedded[key] = Object.fromEntries([
                //@ts-ignore
                ...original.map((item) => [item.name ?? item.label, warpgate.CONST.DELETE]),
                ...embedded.map((item) => [item.name ?? item.label, item]),
            ]);
            delete updates.actor[metadata];
        }
    }
    //@ts-ignore
    await warpgate.mutate(tokenDocument, updates, {}, {
        name: "poly-automated-polymorpher:" + randomID(),
        updateOpts: targetTokenDocData,
    });
    if (tokenDocuments.length === 0) {
        //@ts-ignore
        tokenDocument.delete();
    }
    return tokenDocument;
}
/**
 * Makes some universal additional preparations on the targetData
 * Ideally, this process should be done inside 'prepareDataFromTransformOptions'
 * @param targetData ActorData
 * @returns ActorData
 */
function prepareTargetData(targetData) {
    const _deletions = [
        "-=_id",
        "-=_stats",
        "-=ownership",
        "-=folder",
        "-=sort",
        "-=flags",
        "-=type",
        "prototypeToken.-=actorLink",
        "prototypeToken.-=name",
        "prototypeToken.-=flags",
    ];
    const deletions = Object.fromEntries(_deletions.map((v) => [v, null]));
    mergeObject(targetData, deletions, {
        //@ts-ignore
        performDeletions: true,
    });
    return targetData;
}
