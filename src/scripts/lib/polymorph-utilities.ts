import { PolymorpherFlags, TokenRevertData } from "../automatedPolymorpherModels";
import CONSTANTS from "../constants";
import { getPolymorphsWithWarpgate, revertPolymorphWithWarpgate } from "./warpgate";
import { info, revertFlagsOnActor, transferPermissionsActorInner, warn } from "./lib";

export async function revertOriginalFormImpl(sourceToken: Token, sourceActor: Actor, renderSheet: boolean) {
	if (!sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED)) {
		warn(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphRevertWarn`) + ` type 1`, true);
		return;
	}
	if (!sourceToken.isOwner) {
		warn(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphRevertWarn`) + ` type 2`, true);
		return;
	}

	const previousOriginalActorTokenData = <TokenRevertData[]>(
		sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
	);

	let isTheOriginalActor = false;
	if (!previousOriginalActorTokenData || previousOriginalActorTokenData.length <= 0) {
		isTheOriginalActor = true;
	}

	// Obtain a reference to the original actor
	const original = <Actor>(
		game.actors?.get(<string>sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR))
	);

	if (!original) {
		if (!previousOriginalActorTokenData) {
			warn(
				game.i18n.format(`${CONSTANTS.MODULE_NAME}.polymorphRevertNoOriginalActorWarn`, {
					reference: <string>(
						sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR)
					),
				}),
				true
			);
			return undefined;
		}
	}

	const isRendered = sourceActor.sheet?.rendered;
	if (isRendered) {
		sourceActor.sheet?.close();
	}

	try {
		const useWarpGate = game.settings.get(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate");
		const hasWarpPolymorphs = Boolean(getPolymorphsWithWarpgate(sourceActor).length);
		const WarpGateMode = useWarpGate && hasWarpPolymorphs;

		/**
		 * A hook event that fires just before the actor is reverted to original form.
		 * @function dnd5e.transformActor
		 * @memberof hookEvents
		 * @param {Token} sourceToken
		 * @param {Actor} actorThis                 The original actor before transformation.
		 * @param {boolean} renderSheet             Render Sheet after revert the transformation.
		 */
		Hooks.callAll(`${CONSTANTS.MODULE_NAME}.revertOriginalForm`, sourceToken, sourceActor, renderSheet);

		if (WarpGateMode) {
			// =============================================
			// THIS IS THE SOLUTION WITH WARP GATE (AVOID THE CREATION OF ACTOR)
			// ===========================================
			const mutations = getPolymorphsWithWarpgate(sourceActor);

			if (!mutations || mutations.length == 0) {
				warn(`Array mutation names for the revert is null or empty`);
			}
			if (mutations.length) {
				//info(`${sourceToken.actor?.name} reverts to their ${mutations.length === 1 ? 'original' : 'previous'} form`);
				// TODO show on chat ?
				//await ChatMessage.create({content: `${actor.name} reverts to their original form`, speaker:{alias: actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
				//@ts-ignore
				await revertPolymorphWithWarpgate(sourceActor);
			}
		} else {
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

			// =============================================
			// THIS IS THE DND5E SOLUTION WITh THE CREATION OF ACTOR)
			// ===========================================
			// Get the Tokens which represent this actor
			if (canvas.ready) {
				const tokens = sourceActor.getActiveTokens(true);
				//@ts-ignore
				const tokenData = <TokenDocument>await original.getTokenDocument();
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
			} else if (previousOriginalActorTokenData) {
				const tokenData = previousOriginalActorTokenData;
				const update = <any>duplicate(tokenData);
				//@ts-ignore
				delete update.x;
				//@ts-ignore
				delete update.y;
				await canvas.scene?.updateEmbeddedDocuments("Token", [update]);
			}
			// Delete the polymorphed version of the actor, if possible
			if (!game.settings.get(CONSTANTS.MODULE_NAME, "doNotDeleteTmpActors")) {
				const idsToDelete = <string[]>[];
				idsToDelete.push(<string>sourceActor.id);
				const othersActorsToDelete = <TokenRevertData[]>(
					sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
				);
				if (othersActorsToDelete && Array.isArray(othersActorsToDelete) && othersActorsToDelete.length > 0) {
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
							game.actors?.get(td.actorId)
						) {
							//@ts-ignore
							idsToDelete.push(td.actorId);
						}
					}
				} else {
					warn(
						`Invoked the revert to original, but no flag '${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}' is been found or is empty`
					);
				}
				if (idsToDelete.length > 0) {
					const idsActorToDelete = <string[]>[];
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
	} finally {
		await revertFlagsOnActor(original);
	}
	if (isRendered && renderSheet) {
		original.sheet?.render(isRendered);
	}
	return original;
}

export async function polymorphWithActorLinked(
	sourceToken: Token,
	sourceActor: Actor,
	targetActor: Actor,
	d: any,
	externalUserId: string,
	renderSheet:boolean,
) {
	const transformTokens = true;
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
	await newActor.setFlag(
		CONSTANTS.MODULE_NAME,
		PolymorpherFlags.ORIGINAL_ACTOR,
		getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
	);
	mergeObject(d.prototypeToken, tokenBackup);

	let originalActor = <Actor>(
		game.actors?.get(<string>sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR))
	);
	// If no originalActorIsFounded it must be the orginal itself
	if (!originalActor) {
		originalActor = sourceActor;
	}
	// await transferPermissionsActorInner(originalActor, newActor, externalUserId);

	// Update placed Token instances
	// if (!transformTokens) {
	//   return;
	// }
	let tokens = <Token[]>[];
	
	if (transformTokens) {
		tokens = <Token[]>sourceActor.getActiveTokens(true);
		if (!tokens || tokens.length == 0) {
			tokens = sourceActor.getActiveTokens();
		}
		const tokensTmp = tokens.filter((t) => {
			return sourceActor.id === t.actor?.id;
		});
		tokens = tokensTmp;
	} else {
		tokens = [sourceToken];
	}

	const updates = tokens.map((t) => {
		const newTokenData = <any>foundry.utils.deepClone(d.prototypeToken);
		newTokenData._id = t.id;
		newTokenData.actorId = <string>newActor.id;
		newTokenData.actorLink = true;
		if (!newTokenData.flags) {
			setProperty(newTokenData, `flags`, {});
		}
		setProperty(
			newTokenData.flags,
			`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`,
			getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
		);
		setProperty(newTokenData.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);

		return newTokenData;
	});
	//@ts-ignore
	const tokensFinal = <TokenDocument[]>await canvas.scene?.updateEmbeddedDocuments("Token", updates);
	// TODO Understand why is not working work like on dnd5e
	// const tokensFinal = <TokenDocument[]>[];
	// for (const tokenUpdate of updates) {
	// 	//@ts-ignore
	// 	const token = await TokenDocument.implementation.create(tokenUpdate, {
	// 		parent: canvas.scene,
	// 		keepId: false, // MOD 4535992 on dnd5e is true
	// 		render: false, // MOD 4535992 on dnd5e is true
	// 	});
	// 	await token.update({
	// 		actorId: tokenUpdate.actorId,
	// 		actorLink: tokenUpdate.actorLink
	// 	});
	// 	tokensFinal.push(token);
	// }
	for (const tokenFinal of tokensFinal) {
		// await tokenFinal.update({
		// 	updates[0]
		// });
		// Force this to be true
		await tokenFinal.actor?.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED, true);
		await tokenFinal.actor?.setFlag(
			CONSTANTS.MODULE_NAME,
			PolymorpherFlags.ORIGINAL_ACTOR,
			getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
		);
	}
	await transferPermissionsActorInner(originalActor, newActor, externalUserId);
	/* run mutation and label it 'powermorph' */
	info(`${sourceToken.name} mutate into a ${targetActor.name}`);
	return tokensFinal[0];
}
