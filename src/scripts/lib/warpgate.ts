import { PolymorpherFlags } from "../automatedPolymorpherModels";
import CONSTANTS from "../constants";
import { warn, error, transferPermissionsActorInner, info } from "./lib";

/**
 * Creates a token so it can be mutated by warpgate
 * @param actor
 * @returns Tokendocument in a 'mutable' state by Warpgate
 */
async function createToken(actor: Actor): Promise<TokenDocument> {
	//@ts-ignore
	const baseToken = await actor.getTokenDocument({ hidden: true });
	return <TokenDocument>await baseToken.constructor.create(baseToken, { parent: canvas.scene });
}

/**
 * List all polymorphs the actor has done in the past and are succestible to 'warpgate.revert'
 * Getting the information directly from warpgate is less prone to error and simplifies the module
 * @param actor
 * @returns List of mutations the actor has
 */
export function getPolymorphsWithWarpgate(actor: Actor) {
	const regex = /poly-automated-polymorpher:.+/;
	const mutations = <any[]>actor.getFlag("warpgate", "mutate") ?? [];
	return mutations?.filter((mut) => regex.exec(mut.name)) ?? [];
}

/**
 * Gets the active linked tokens of the actor
 * @param actor
 * @returns List of active tokens, linked to the actor
 */
async function getTokens(actor: Actor) {
	if (actor.token) {
		return [actor.token];
	}
	const tokens = actor
		.getActiveTokens()
		.map((t) => t.document)
		//@ts-ignore
		.filter((doc: TokenDocument) => doc.actorLink);
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
export async function revertPolymorphWithWarpgate(actor: Actor, name: string | undefined) {
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
export async function polymorphWithWarpgate(
	sourceActor: Actor,
	targetActor: Actor,
	targetTokenDocData: any
): Promise<TokenDocument> {
	//@ts-ignore
	if (!sourceActor instanceof Actor) {
		throw error(`The sourceActorData must be a Actor object`);
	}
	let sourceActorData = <any>sourceActor;
	//@ts-ignore
	if (sourceActor instanceof Actor) {
		sourceActorData = sourceActor.toObject();
	}
	let targetActorData = <any>targetActor;
	if (targetActor instanceof Actor) {
		// throw error(`The sourceActorData cannot be a Actor object`);
		targetActorData = targetActor.toObject();
	}
	// If the source is an Actor, we create a temporary token, wich will be deleted once warpgate is set
	const tokenDocuments = await getTokens(sourceActor);
	const tokenDocument = tokenDocuments?.[0] ?? createToken(sourceActor);

	const actorData = sourceActorData;
	// TODO can't delete the '_id' ???
	prepareTargetData(targetActorData);
	if (!targetTokenDocData) {
		warn(`No token data is been passed on the polymorph warpgate method`);
		//@ts-ignore
		targetTokenDocData = targetActorData.prototypeToken;
	}

	const updates = {
		//@ts-ignore
		token: targetActorData.prototypeToken, // targetTokenDocData, // targetActor.prototypeToken,
		actor: targetActorData,
		embedded: {},
	};
	//@ts-ignore
	for (const [key, value] of Object.entries(Actor.implementation.metadata.embedded)) {
		const metadata = <any>value;
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
	await warpgate.mutate(
		tokenDocument,
		updates,
		{},
		{
			name: "poly-automated-polymorpher:" + randomID(),
			updateOpts: targetTokenDocData,
		}
	);

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
function prepareTargetData(targetData: Actor | any): Actor {
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

	return <any>targetData;
}
