import type { TokenData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import { ANIMATIONS } from "./animations";
import {
	PolymorpherData,
	PolymorpherFlags,
	TokenRevertData,
	TransformOptionsGeneric,
} from "./automatedPolymorpherModels";
import CONSTANTS from "./constants";
import {
	error,
	info,
	isEmptyObject,
	retrieveActorFromData,
	retrieveActorFromToken,
	revertFlagsOnActor,
	transferPermissionsActorInner,
	wait,
	warn,
} from "./lib/lib";
import { PolymorpherManager } from "./polymorphermanager";
import { automatedPolymorpherSocket } from "./socket";
import D35E from "./systems/D35E";
import dnd5e from "./systems/dnd5e";
import generic from "./systems/generic";
import pf1 from "./systems/pf1";
import pf2e from "./systems/pf2e";
import swade from "./systems/swade";

const API = {
	async invokePolymorpherManagerFromActorArr(...inAttributes: any[]) {
		if (!Array.isArray(inAttributes)) {
			throw error("invokePolymorpherManagerFromActorArr | inAttributes must be of type array");
		}
		const [sourceActorIdOrName, removePolymorpher, ordered, random, animationExternal, cloneFlags] = inAttributes;
		const result = await (this as typeof API).invokePolymorpherManagerFromActor(
			sourceActorIdOrName,
			removePolymorpher,
			ordered,
			random,
			animationExternal
		);
		return result;
	},

	async invokePolymorpherManagerFromActor(
		sourceActorIdOrName: string,
		removePolymorpher = false,
		ordered = false,
		random = false,
		animationExternal: { sequence: undefined; timeToWait: 0 } | undefined = undefined
	): Promise<void> {
		for (const tokenOnCanvas of <Token[]>canvas.tokens?.placeables) {
			const actor = retrieveActorFromToken(tokenOnCanvas);
			if (actor && (actor.id === sourceActorIdOrName || actor.name === sourceActorIdOrName)) {
				await this._invokePolymorpherManagerInner(
					tokenOnCanvas,
					actor,
					removePolymorpher,
					ordered,
					random,
					animationExternal
				);
				break;
			}
		}
	},

	async invokePolymorpherManagerArr(...inAttributes: any[]) {
		if (!Array.isArray(inAttributes)) {
			throw error("invokePolymorpherManagerArr | inAttributes must be of type array");
		}
		const [sourceTokenIdOrName, removePolymorpher, ordered, random, animationExternal, cloneFlags] = inAttributes;
		const result = await (this as typeof API).invokePolymorpherManager(
			sourceTokenIdOrName,
			removePolymorpher,
			ordered,
			random,
			animationExternal
		);
		return result;
	},

	async invokePolymorpherManager(
		sourceTokenIdOrName: string,
		removePolymorpher = false,
		ordered = false,
		random = false,
		animationExternal: { sequence: undefined; timeToWait: 0 } | undefined = undefined
	): Promise<void> {
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
		await this._invokePolymorpherManagerInner(
			sourceToken,
			sourceActor,
			removePolymorpher,
			ordered,
			random,
			animationExternal
		);
	},

	async _invokePolymorpherManagerInner(
		currentToken: Token,
		currentActor: Actor,
		removePolymorpher: boolean,
		ordered: boolean,
		random: boolean,
		animationExternal: { sequence: undefined; timeToWait: 0 } | undefined = undefined
	): Promise<void> {
		const listPolymorphers: PolymorpherData[] =
			<PolymorpherData[]>currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];

		let isOrdered = ordered;
		let isRandom = random;

		if (!ordered && currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED)) {
			isOrdered = <boolean>currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED) ?? false;
		}
		if (!random && currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM)) {
			isRandom = <boolean>currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM) ?? false;
		}

		// TODO find a better method than this
		let lastElement = "";
		const matches = <any[]>currentToken.name.match(/(?<=\().+?(?=\))/g);
		if (matches && matches.length > 0) {
			lastElement = matches[matches.length - 1];
		} else {
			lastElement = currentToken.name;
		}

		if (removePolymorpher) {
			// =====================================
			// REVERT TO ORIGINAL FORM
			// =====================================

			// const updatesForRevert = <TokenRevertData[]>(
			// 	currentActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
			// );
			// if (!updatesForRevert || updatesForRevert.length <= 0) {
			// 	await currentActor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
			// 	await currentActor?.unsetFlag(
			// 		CONSTANTS.MODULE_NAME,
			// 		PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR
			// 	);
			// 	warn(
			// 		`Can't revert this token without the flag '${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}'`,
			// 		true
			// 	);
			// 	return;
			// }

			const polyData = listPolymorphers.find((a) => {
				return (
					lastElement.toLowerCase().includes(a.name.toLowerCase()) ||
					(a.explicitname && lastElement.toLowerCase().includes(a.explicitname.toLowerCase()))
				);
			});
			const polyDataIndex = listPolymorphers.findIndex((a) => {
				return (
					lastElement.toLowerCase().includes(a.name.toLowerCase()) ||
					(a.explicitname && lastElement.toLowerCase().includes(a.explicitname.toLowerCase()))
				);
			});

			const animation = polyData?.animation;
			//@ts-ignore
			const tokenDataToTransform = <TokenDocument>await currentActor.getTokenDocument();
			const tokenFromTransform = <Token>canvas.tokens?.placeables.find((t: Token) => {
					return t.actor?.id === currentActor.id;
				}) || tokenDataToTransform;

			if (animationExternal && animationExternal.sequence) {
				//@ts-ignore
				await animationExternal.sequence.play();
				await wait(animationExternal.timeToWait);
			} else if (animation) {
				if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
					//@ts-ignore
					// game.macros
					// 	?.getName(ANIMATIONS.animationFunctions[animation].fn)
					// 	//@ts-ignore
					// 	?.execute({ tokenFromTransform, tokenDataToTransform });
					evaluateExpression(
						//@ts-ignore
						game.macros?.getName(ANIMATIONS.animationFunctions[animation].fn)?.command,
						tokenFromTransform,
						tokenDataToTransform
					);
				} else {
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
				await revertFlagsOnActor(currentActor);
				return;
			}
			const actorOriginal = <Actor>game.actors?.get(actorOriginalId);
			if (!actorOriginal) {
				warn(
					`NO actor returned from revert polymorph action with id ${actorOriginalId}. Check out the logs`,
					true
				);
				return;
			}
		} else {
			// ================================
			// TRANSFORM INTO
			// ================================

			if (isRandom && isOrdered) {
				warn(`Attention you can't enable the 'ordered' and the 'random' both at the same time`);
				return;
			}
			if (isRandom) {
				if (listPolymorphers?.length === 1) {
					new PolymorpherManager(currentActor, currentToken).fastSummonPolymorpher(
						<PolymorpherData>listPolymorphers[0],
						animationExternal
					);
				} else {
					const polyDataIndex = listPolymorphers.findIndex((a) => {
						return (
							lastElement.toLowerCase().includes(a.name.toLowerCase()) ||
							(a.explicitname && lastElement.toLowerCase().includes(a.explicitname.toLowerCase()))
						);
					});
					let randomIndex = 0;
					while (randomIndex === polyDataIndex) {
						randomIndex = Math.floor(Math.random() * listPolymorphers.length);
					}
					new PolymorpherManager(currentActor, currentToken).fastSummonPolymorpher(
						<PolymorpherData>listPolymorphers[randomIndex],
						animationExternal
					);
				}
			} else if (isOrdered) {
				const polyDataIndex = listPolymorphers.findIndex((a) => {
					return (
						lastElement.toLowerCase().includes(a.name.toLowerCase()) ||
						(a.explicitname && lastElement.toLowerCase().includes(a.explicitname.toLowerCase()))
					);
				});
				const nextIndex = polyDataIndex + 1;
				if (listPolymorphers?.length - 1 < nextIndex) {
					new PolymorpherManager(currentActor, currentToken).fastSummonPolymorpher(
						<PolymorpherData>listPolymorphers[0],
						animationExternal
					);
				} else {
					new PolymorpherManager(currentActor, currentToken).fastSummonPolymorpher(
						<PolymorpherData>listPolymorphers[nextIndex],
						animationExternal
					);
				}
			} else {
				new PolymorpherManager(currentActor, currentToken).render(true);
			}
		}
	},

	async cleanUpTokenSelectedArr(...inAttributes) {
		const result = await this.cleanUpTokenSelected();
		return result;
	},

	async cleanUpTokenSelected() {
		const tokens = <Token[]>canvas.tokens?.controlled;
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
						const senseOrConditionValue = <any>p[key];
						await token.actor.unsetFlag(CONSTANTS.MODULE_NAME, senseOrConditionIdKey);
					}
					info(`Cleaned up token '${token.name}'`, true);
				}
			} else {
				warn(`No token found on the canvas for id '${token.id}'`, true);
			}
		}
		for (const token of tokens) {
			if (token && token.actor) {
				if (getProperty(token.actor, `flags.${CONSTANTS.MODULE_NAME}`)) {
					const p = getProperty(token.actor, `flags.${CONSTANTS.MODULE_NAME}`);
					for (const key in p) {
						const senseOrConditionIdKey = key;
						const senseOrConditionValue = <any>p[key];
						await token.actor.unsetFlag(CONSTANTS.MODULE_NAME, senseOrConditionIdKey);
					}
					info(`Cleaned up actor '${token.name}'`, true);
				}
			} else {
				warn(`No token found on the canvas for id '${token.id}'`, true);
			}
		}
	},

	async retrieveAndPrepareActorArr(...inAttributes) {
		if (!Array.isArray(inAttributes)) {
			throw error("retrieveAndPrepareActorArr | inAttributes must be of type array");
		}
		const [aUuid, aId, aName, currentCompendium, createOnWorld, sourceActorId, userId, cloneFlags] = inAttributes;
		const result = await this.retrieveAndPrepareActor(
			aUuid,
			aId,
			aName,
			currentCompendium,
			createOnWorld,
			sourceActorId,
			userId
		);
		return result.id;
	},

	async retrieveAndPrepareActor(
		aUuid: string,
		aId: string,
		aName: string,
		currentCompendium: string,
		createOnWorld: boolean,
		sourceActorId: string,
		userId: string
	): Promise<Actor | null> {
		const targetActor = await retrieveActorFromData(aUuid, aId, aName, currentCompendium, createOnWorld);
		const sourceActor = await retrieveActorFromData(aUuid, sourceActorId, undefined, undefined, false);
		const user = <User>game.users?.get(userId);
		if (!user.isGM && game.user?.isGM) {
			if (sourceActor && targetActor) {
				transferPermissionsActorInner(sourceActor, targetActor, <string>user.id);
			}
		}
		return targetActor;
	},

	get polymorphSetting(): TransformOptionsGeneric {
		return <TransformOptionsGeneric>game.settings.get(CONSTANTS.MODULE_NAME, "polymorphSetting");
	},

	async transformIntoArr(...inAttributes): Promise<any> {
		if (!Array.isArray(inAttributes)) {
			throw error("transformIntoArr | inAttributes must be of type array");
		}
		const [
			sourceTokenId,
			sourceActorId,
			sourceActorName,
			targetActorId,
			targetActorName,
			transformOptions,
			renderSheet,
			externalUserId,
			cloneFlags,
		] = inAttributes;

		const sourceToken = <Token>canvas.tokens?.placeables.find((t) => {
			return t.id === sourceTokenId;
		});
		if (!sourceToken) {
			warn(`No source token found with reference '${sourceTokenId}'`, true);
			return undefined;
		}

		let sourceActor = <Actor>retrieveActorFromToken(sourceToken);
		if (
			//@ts-ignore
			!hasProperty(sourceActor.flags, CONSTANTS.MODULE_NAME) ||
			//@ts-ignore
			isEmptyObject(getProperty(sourceActor.flags, CONSTANTS.MODULE_NAME))
		) {
			sourceActor = <Actor>await retrieveActorFromData(undefined, sourceActorId, "", "", false);
		}
		if (!sourceActor) {
			warn(`No source actor found with reference '${sourceTokenId}'`, true);
			return undefined;
		}

		if (cloneFlags) {
			setProperty(sourceActor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
			setProperty(<Actor>sourceToken?.actor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
		}

		const polymoprhers: PolymorpherData[] =
			<PolymorpherData[]>sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];
		if (!polymoprhers) {
			warn(
				`No polymorph flags with id '${PolymorpherFlags.POLYMORPHERS}' is been found!  Usually this happened with unlinked token, sadly you need a linked actor to the token`
			);
			return undefined;
		}

		const currentPolymorph = <PolymorpherData>polymoprhers.find((p) => {
			return p.id === targetActorId || p.name === targetActorName;
		});
		if (!currentPolymorph) {
			warn(
				`No polymoprher is been found! Usually this happened with unlinked token, sadly you need a linked actor to the token`
			);
			return undefined;
		}

		const targetActor = await retrieveActorFromData(
			currentPolymorph?.uuid,
			currentPolymorph?.id,
			currentPolymorph?.name,
			currentPolymorph?.compendiumid,
			false
		);
		if (!targetActor) {
			warn(`No target actor found with reference '${sourceTokenId}'`, true);
			return;
		}

		if (cloneFlags) {
			setProperty(targetActor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
		}

		const something = await this.transformIntoImpl(
			sourceToken,
			sourceActor,
			targetActor,
			transformOptions,
			renderSheet,
			externalUserId
		);
		return something;
	},

	async transformInto(
		sourceToken: Token,
		sourceActor: Actor,
		targetActor: Actor,
		transformOptions: TransformOptionsGeneric,
		renderSheet: boolean,
		externalUserId: string
	): Promise<any> {
		const something = await automatedPolymorpherSocket.executeAsGM(
			"transformInto",
			sourceToken.id,
			sourceActor.id,
			sourceActor.name,
			targetActor.id,
			targetActor.name,
			transformOptions,
			renderSheet,
			externalUserId
		);
		return something;
	},

	async revertOriginalFormArr(...inAttributes): Promise<string | undefined> {
		if (!Array.isArray(inAttributes)) {
			throw error("revertOriginalFormArr | inAttributes must be of type array");
		}
		const [sourceTokenId, sourceActorId, sourceActorName, renderSheet, cloneFlags] = inAttributes;

		const sourceToken = <Token>canvas.tokens?.placeables.find((t) => {
			return t.id === sourceTokenId;
		});
		if (!sourceToken) {
			warn(`No source token found with reference '${sourceTokenId}'`, true);
			return undefined;
		}

		let sourceActor = <Actor>retrieveActorFromToken(sourceToken);
		if (
			//@ts-ignore
			!hasProperty(sourceActor.flags, CONSTANTS.MODULE_NAME) ||
			//@ts-ignore
			isEmptyObject(getProperty(sourceActor.flags, CONSTANTS.MODULE_NAME))
		) {
			sourceActor = <Actor>await retrieveActorFromData(undefined, sourceActorId, "", "", false);
		}
		if (!sourceActor) {
			warn(`No source actor found with reference '${sourceTokenId}'`, true);
			return undefined;
		}

		if (cloneFlags) {
			setProperty(sourceActor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
			setProperty(<Actor>sourceToken?.actor, `flags.${CONSTANTS.MODULE_NAME}`, cloneFlags);
		}

		const originalActor = <Actor>await this.revertOriginalFormImpl(sourceToken, sourceActor, renderSheet);
		return <string>originalActor?.id;
	},

	async revertOriginalForm(
		sourceToken: Token,
		sourceActor: Actor,
		renderSheet: boolean
	): Promise<string | undefined> {
		let actorOriginalId = <string>(
			await automatedPolymorpherSocket.executeAsGM(
				"revertOriginalForm",
				sourceToken.id,
				sourceActor.id,
				sourceActor.name,
				renderSheet
			)
		);
		if (!actorOriginalId) {
			warn(`NO actor id returned from revert polymorph action. Check out the logs`, true);
			await revertFlagsOnActor(sourceActor);
			return undefined;
		}
		const actorOriginal = <Actor>game.actors?.get(actorOriginalId);
		if (!actorOriginal) {
			warn(`NO actor returned from revert polymorph action with id ${actorOriginalId}. Check out the logs`, true);
			return undefined;
		}
		return <string>actorOriginal?.id;
	},

	async transformIntoImpl(
		sourceToken: Token,
		sourceActor: Actor,
		targetActor: Actor,
		transformOptions: TransformOptionsGeneric,
		renderSheet: boolean,
		externalUserId: string
	): Promise<any> {
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
		if (!game.actors?.get(<string>sourceActor.id)) {
			warn(`No source actor is been found`, true);
			return undefined;
		}
		// if(!game.actors?.get(<string>targetActor.id)){
		//   warn(`No target actor is been found`, true);
		//   return;
		// }

		if (game.system.id === "D35E") {
			return await D35E.transformInto(
				sourceToken,
				sourceActor,
				targetActor,
				transformOptions,
				renderSheet,
				externalUserId
			);
		} else if (game.system.id === "dnd5e") {
			return await dnd5e.transformInto(
				sourceToken,
				sourceActor,
				targetActor,
				transformOptions,
				renderSheet,
				externalUserId
			);
		} else if (game.system.id === "pf1") {
			return await pf1.transformInto(
				sourceToken,
				sourceActor,
				targetActor,
				transformOptions,
				renderSheet,
				externalUserId
			);
		} else if (game.system.id === "pf2e") {
			return await pf2e.transformInto(
				sourceToken,
				sourceActor,
				targetActor,
				transformOptions,
				renderSheet,
				externalUserId
			);
		} else if (game.system.id === "swade") {
			return await swade.transformInto(
				sourceToken,
				sourceActor,
				targetActor,
				transformOptions,
				renderSheet,
				externalUserId
			);
		} else {
			return await generic.transformInto(
				sourceToken,
				sourceActor,
				targetActor,
				transformOptions,
				renderSheet,
				externalUserId
			);
		}
	},

	/**
	 * If this actor was transformed with transformTokens enabled, then its
	 * active tokens need to be returned to their original state. If not, then
	 * we can safely just delete this actor.
	 * @param {boolean} [renderSheet] Render Sheet after revert the transformation.
	 * @returns {Promise<Actor>|null}  Original actor if it was reverted.
	 */
	async revertOriginalFormImpl(
		sourceToken: Token,
		sourceActor: Actor,
		renderSheet: boolean
	): Promise<Actor | undefined> {
		if (game.system.id === "D35E") {
			return await D35E.revertOriginalForm(sourceToken, sourceActor, renderSheet);
		} else if (game.system.id === "dnd5e") {
			return await dnd5e.revertOriginalForm(sourceToken, sourceActor, renderSheet);
		} else if (game.system.id === "pf1") {
			return await pf1.revertOriginalForm(sourceToken, sourceActor, renderSheet);
		} else if (game.system.id === "pf2e") {
			return await pf2e.revertOriginalForm(sourceToken, sourceActor, renderSheet);
		} else if (game.system.id === "swade") {
			return await swade.revertOriginalForm(sourceToken, sourceActor, renderSheet);
		} else {
			return await generic.revertOriginalForm(sourceToken, sourceActor, renderSheet);
		}
	},

	async renderDialogTransformOptionsImpl(
		sourceToken: Token,
		sourceActor: Actor,
		targetActor: Actor,
		explicitName: string,
		animation: string
	): Promise<Dialog<DialogOptions>> {
		if (game.system.id === "D35E") {
			return await D35E.renderDialogTransformOptions(
				sourceToken,
				sourceActor,
				targetActor,
				explicitName,
				animation
			);
		} else if (game.system.id === "dnd5e") {
			return await dnd5e.renderDialogTransformOptions(
				sourceToken,
				sourceActor,
				targetActor,
				explicitName,
				animation
			);
		} else if (game.system.id === "pf1") {
			return await pf1.renderDialogTransformOptions(
				sourceToken,
				sourceActor,
				targetActor,
				explicitName,
				animation
			);
		} else if (game.system.id === "pf2e") {
			return await pf2e.renderDialogTransformOptions(
				sourceToken,
				sourceActor,
				targetActor,
				explicitName,
				animation
			);
		} else if (game.system.id === "swade") {
			return await swade.renderDialogTransformOptions(
				sourceToken,
				sourceActor,
				targetActor,
				explicitName,
				animation
			);
		} else {
			return await generic.renderDialogTransformOptions(
				sourceToken,
				sourceActor,
				targetActor,
				explicitName,
				animation
			);
		}
	},
};

export default API;
