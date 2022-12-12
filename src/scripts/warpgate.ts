/**
 * Creates a token so it can be mutated by warpgate
 * @param actor
 * @returns Tokendocument in a 'mutable' state by Warpgate
 */
async function createToken(actor: Actor) {
	const baseToken = await actor.getTokenDocument({ hidden: true });
	return await baseToken.constructor.create(baseToken, { parent: canvas.scene });
}

/**
 * List all polymorphs the actor has done in the past and are succestible to 'warpgate.revert'
 * Getting the information directly from warpgate is less prone to error and simplifies the module
 * @param actor
 * @returns List of mutations the actor has
 */
export function getPolymorphs(actor: Actor) {
	const regex = /poly:.+/;
	const mutations = actor.getFlag('warpgate', 'mutate');
	return mutations?.filter((mut) => regex.exec(mut.name)) ?? [];
}

/**
 * Gets the active linked tokens of the actor
 * @param actor
 * @returns List of active tokens, linked to the actor
 */
async function getTokens(actor: Actor) {
	if (actor.token) return [actor.token];
	const tokens = actor
		.getActiveTokens()
		.map((t) => t.document)
		.filter((doc) => doc.actorLink);
	if (tokens.length) return tokens;
	return [];
}

/**
 * Reverts a polymorph
 * @param actor
 * @param name Mutation name, if undefined reverts the last mutation
 */
export async function revertPolymorph(actor: Actor, name: string) {
	const tokens = await getTokens(actor);
	const token = tokens[0] ?? createToken(actor);
	if (name === undefined) {
		const poly = getPolymorphs(actor);
		name = poly[poly.length - 1].name;
	}

	await warpgate.revert(token, name);

	if (tokens.length === 0) token.delete();
}

/**
 * Polymorphs an Actor into the targetData
 * @param sourceActor
 * @param Data targetData
 * @returns Warpgate Mutation
 */
export async function polymorph(sourceActor: Actor, targetData: ActorData) {
	// If the source is an Actor, we create a temporary token, wich will be deleted once warpgate is set
	const tokens = await getTokens(sourceActor);
	const token = tokens?.[0] ?? createToken(sourceActor);

	const actorData = sourceActor.toObject();

	prepareTargetData(targetData);

	const updates = {
		token: targetData.prototypeToken,
		actor: targetData,
		embedded: {},
	};

	for (const [key, value] of Object.entries(Actor.implementation.metadata.embedded)) {
		const embedded = updates.actor[value];
		const original = actorData[value];
		if (embedded) {
			updates.embedded[key] = Object.fromEntries([
				...original.map((item) => [item.name, warpgate.CONST.DELETE]),
				...embedded.map((item) => [item.name, item]),
			]);
			delete updates.actor[value];
		}
	}

	await warpgate.mutate(token, updates, {}, { name: 'poly:' + randomID() });

	if (tokens.length === 0) token.delete();
}

/**
 * Makes some universal additional preparations on the targetData
 * Ideally, this process should be done inside 'prepareDataFromTransformOptions'
 * @param targetData ActorData
 * @returns ActorData
 */
function prepareTargetData(targetData: ActorData) {
	const _deletions = [
		'-=_id',
		'-=_stats',
		'-=ownership',
		'-=folder',
		'-=sort',
		'-=flags',
		'-=type',
		'prototypeToken.-=actorLink',
		'prototypeToken.-=name',
		'prototypeToken.-=flags',
	];
	const deletions = Object.fromEntries(_deletions.map((v) => [v, null]));

	mergeObject(targetData, deletions, { performDeletions: true });

	return targetData;
}
