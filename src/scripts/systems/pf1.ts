import type { ActorDataBaseProperties } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/actorData";
import type {
	ActorData,
	PrototypeTokenData,
	TokenData,
} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import type { PropertiesToSource } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { ANIMATIONS } from "../animations";
import {
	PolymorpherData,
	PolymorpherFlags,
	TokenRevertData,
	TransformOptionsGeneric,
} from "../automatedPolymorpherModels";
import CONSTANTS from "../constants";
import { debug, i18n, info, log, transferPermissionsActorInner, wait, warn } from "../lib/lib";

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
	 * @property {string} [explicitName]  Explicit name for generated actor
	 */
	polymorphSettings: <TransformOptionsGeneric>{
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
		removeAE: false,
		keepAEOnlyOriginNotEquipment: false,
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
		removeAE: `${CONSTANTS.MODULE_NAME}.polymorphRemoveAE`,
		keepAEOnlyOriginNotEquipment: `${CONSTANTS.MODULE_NAME}.polymorphKeepAEOnlyOriginNotEquipment`,
		transformTokens: `${CONSTANTS.MODULE_NAME}.polymorphTransformTokens`,
		explicitName: `${CONSTANTS.MODULE_NAME}.polymorphExplicitName`,
	},

	/**
	 * Transform this Actor into another one.
	 *
	 * @param {Token} sourceToken                 The original token before transformation.
	 * @param {Actor} sourceActor                 The original actor before transformation.
	 * @param {Actor} targetActor                      The target Actor.
	 * @param {TransformationOptions} [options={}]  Options that determine how the transformation is performed.
	 * @param {boolean}                           Render the sheet after transformation
	 * @returns {Promise<Array<Token>>|null}        Updated token if the transformation was performed.
	 */
	async transformInto(
		sourceToken: Token,
		sourceActor: Actor,
		targetActor: Actor,
		transformOptions: TransformOptionsGeneric | undefined = undefined,
		renderSheet = true
	): Promise<any> {
		const useWarpGate = game.settings.get(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate");
		const transformTokens = transformOptions?.transformTokens || true;

		// Get the original Actor data and the new source data
		let originalActorData;
		try {
			originalActorData = sourceActor.toJSON();
		} catch (e) {
			// TODO strange bug toJson is undefined ?
			originalActorData = sourceActor.toObject();
		}
		//@ts-ignore
		mergeObject(originalActorData.system, sourceActor.system);
		/* get the full actor data */
		let targetActorData;
		try {
			targetActorData = targetActor.toJSON();
		} catch (e) {
			// TODO strange bug toJson is undefined ?
			targetActorData = targetActor.toObject();
		}
		//@ts-ignore
		mergeObject(targetActorData.system, targetActor.system);

		const targetActorImages = await targetActor.getTokenImages();
		//@ts-ignore
		const sourceEffects = sourceToken.actor ? sourceToken.actor.effects : sourceToken.effects;

		const d = await this.prepareDataFromTransformOptions(
			originalActorData,
			targetActorData,
			sourceEffects,
			targetActorImages,
			transformOptions
		);

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
		Hooks.callAll(
			`${CONSTANTS.MODULE_NAME}.transformActor`,
			sourceToken,
			sourceActor,
			targetActor,
			d,
			transformOptions,
			renderSheet
		);

		// =====================================
		// END SPECIFIC MANAGEMENT FOR SYSTEM
		// =====================================

		// Set new data flags (TODO FIND A BTTER CODE FOR THIS)
		if (!sourceToken.actor) {
			setProperty(sourceToken, `actor`, {});
		}
		//@ts-ignore
		if (!sourceToken.actor?.flags) {
			setProperty(<any>sourceToken.actor, `flags`, {});
		}
		//@ts-ignore
		if (!sourceToken.actor?.flags[CONSTANTS.MODULE_NAME]) {
			//@ts-ignore
			setProperty(<any>sourceToken.actor?.flags, `${CONSTANTS.MODULE_NAME}`, {});
		}
		setProperty(
			d.flags,
			`${CONSTANTS.MODULE_NAME}`,
			//@ts-ignore
			getProperty(<any>sourceToken.actor?.flags, `${CONSTANTS.MODULE_NAME}`)
		);
		//setProperty(d.flags, `${CONSTANTS.MODULE_NAME}`, getProperty(actorThis.flags, `${CONSTANTS.MODULE_NAME}`));
		//@ts-ignore
		mergeObject(d.flags, sourceActor.flags);
		if (
			!sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED) ||
			!getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
		) {
			setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, sourceActor.id);
		}
		setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);

		let previousTokenData =
			<TokenRevertData[]>(
				sourceActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
			) || [];
		// const currentTokenData = await sourceActor.getTokenDocument();
		const currentTokenData = sourceToken.document;

		if (currentTokenData.id && previousTokenData.filter((z) => z.id === currentTokenData.id).length <= 0) {
			previousTokenData.push({
				//@ts-ignore
				actorId: <string>currentTokenData.actorId,
				id: <string>currentTokenData.id,
			});
			previousTokenData = previousTokenData.filter(
				(value, index, self) => index === self.findIndex((t) => t.id === null || t.id === value.id)
			);
		}
		setProperty(
			d.flags,
			`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}`,
			previousTokenData
		);

		if (!d.prototypeToken.flags) {
			d.prototypeToken.flags = {};
		}
		mergeObject(d.prototypeToken.flags, d.flags);

		// Step up the array of mutation names
		let arrayMutationNames: string[] = <string[]>(
			sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT)
		);
		if (!arrayMutationNames || arrayMutationNames.length == 0) {
			arrayMutationNames =
				<string[]>sourceActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT) || [];
		}
		const mutationNameOriginalToken = sourceToken.id + "_" + randomID();
		if (!arrayMutationNames.includes(mutationNameOriginalToken)) {
			arrayMutationNames.push(mutationNameOriginalToken);
		}
		setProperty(
			d.prototypeToken.flags,
			`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`,
			arrayMutationNames
		);

		// Close sheet for non-transformed Actor
		await sourceActor.sheet?.close();

		if (useWarpGate) {
			// =============================================
			// THIS IS THE SOLUTION WITH WARP GATE (AVOID THE CREATION OF ACTOR)
			// ===========================================

			/* get the new protodata and remove its null x/y */
			const newActor = targetActor;
			//@ts-ignore
			let proto = <TokenDocument>(await newActor.getTokenDocument()).toObject();
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
				(thisClass) => thisClass.metadata.collection
			);

			/* delete any embedded fields from the actor data */
			embeddedFields.forEach((field) => {
				delete newRootActorData[field];
			});

			// END _getRootActorData

			/* for some strange reason for pass the elemnt to the actor i nedd to reset everything for the actor */
			/* for things like effects ecc... */
			// TODO
			const newActorData = await this.prepareDataFromTransformOptions(
				newRootActorData,
				targetActorData,
				//@ts-ignore
				proto.effects,
				targetActorImages,
				transformOptions
			);
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
				token: <any>{
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
			const sheet = <any>sourceToken.actor?.sheet;
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
				setProperty(
					updates.token.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`,
					getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
				);
				setProperty(updates.token.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
				setProperty(
					updates.token.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`,
					arrayMutationNames
				);
				// NEDDED FOR WARPGATE ????
				//@ts-ignore
				if (!updates.actor.flags) {
					setProperty(updates.actor, `flags`, {});
				}
				setProperty(
					//@ts-ignore
					updates.actor.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`,
					getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
				);
				setProperty(
					//@ts-ignore
					updates.actor.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`,
					getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`)
				);
				setProperty(updates.actor, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
				// ======================================================================================

				// TODO show on chat ?
				//await ChatMessage.create({content: `${actorThis.name} mutate into a ${actorToTransform.name}`, speaker:{alias: actorThis.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
				//@ts-ignore
				const tokensMutate = await warpgate.mutate(
					sourceToken.document ? sourceToken.document : sourceToken, // TODO why sourceToken is a TokenDocument and not a Token ?
					updates,
					{},
					{
						name: mutationNameOriginalToken, // User provided name, or identifier, for this particular mutation operation. Used for 'named revert'.
						//comparisonKeys:{ ActiveEffect: 'label'}
						delta: {
							token: updates.token,
							actor: updates.actor,
							embedded: {},
						},
					}
				);
				return;
			}

			const tokens = sourceActor.getActiveTokens(true);
			tokens.map(async (t: Token) => {
				const newTokenData = <any>foundry.utils.deepClone(updates);
				//newTokenData._id = t.id;

				// ======================================================================================
				// SETTING FLAGS
				if (!newTokenData.token.flags) {
					setProperty(newTokenData.token, `flags`, {});
				}
				setProperty(
					newTokenData.token.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`,
					getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
				);
				setProperty(
					newTokenData.token.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`,
					true
				);
				setProperty(
					newTokenData.token.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`,
					arrayMutationNames
				);
				// NEDDED FOR WARPGATE ????
				if (!newTokenData.actor) {
					setProperty(newTokenData.actor, `actor`, {});
				}
				if (!newTokenData.actor.flags) {
					setProperty(newTokenData.actor, `flags`, {});
				}
				setProperty(
					//@ts-ignore
					newTokenData.actor.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`,
					getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
				);
				setProperty(
					//@ts-ignore
					newTokenData.actor.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`,
					getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`)
				);
				setProperty(newTokenData.actor, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);
				// =======================================================================================================

				// TODO show on chat ?
				//await ChatMessage.create({content: `${actorThis.name} mutate into a ${actorToTransform.name}`, speaker:{alias: actorThis.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
				//@ts-ignore
				const tokensMutate = await warpgate.mutate(
					t.document ? t.document : t, // TODO why sourceToken is a TokenDocument and not a Token ?
					newTokenData,
					{},
					{
						name: mutationNameOriginalToken, // User provided name, or identifier, for this particular mutation operation. Used for 'named revert'.
						//comparisonKeys:{ ActiveEffect: 'label'}
						delta: {
							token: updates.token,
							actor: updates.actor,
							embedded: {},
						},
					}
				);
				return newTokenData;
			});
		} else {
			// =============================================
			// THIS IS THE DND5E SOLUTION WITh THE CREATION OF ACTOR)
			// ===========================================

			// Update unlinked Tokens in place since they can simply be re-dropped from the base actor
			// TODO SEEM NOT WORKING ???
			// if (sourceActor.isToken) {
			// 	const tokenData = d.prototypeToken;
			// 	// tokenData.actorData = d;
			// 	setProperty(tokenData, `actorData`, d);
			// 	//@ts-ignore
			// 	delete tokenData.actorData.token;

			// 	return sourceActor.token?.update(tokenData);
			// }

			// Some info like height and weight of the token are reset to default
			// after the constructor of the actor is invoked solved with a backup of the info of the token
			const tokenBackup = duplicate(d.prototypeToken);
			// Create new Actor with transformed data
			//@ts-ignore
			const newActor = await sourceActor.constructor.create(d, { renderSheet: renderSheet });
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
			await transferPermissionsActorInner(originalActor, newActor, <User>game.user);

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
				const newTokenData = <TokenData>foundry.utils.deepClone(d.prototypeToken);
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
			for (const tokenFinal of tokensFinal) {
				// Force this to be true
				await tokenFinal.actor?.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED, true);
				await tokenFinal.actor?.setFlag(
					CONSTANTS.MODULE_NAME,
					PolymorpherFlags.ORIGINAL_ACTOR,
					getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
				);
			}
			return tokensFinal;
		}

		/* run mutation and label it 'powermorph' */
		info(`${sourceToken.name} mutate into a ${targetActor.name}`);
	},

	/**
	 * If this actor was transformed with transformTokens enabled, then its
	 * active tokens need to be returned to their original state. If not, then
	 * we can safely just delete this actor.
	 * @param {boolean} [renderSheet] Render Sheet after revert the transformation.
	 * @returns {Promise<Actor>|null}  Original actor if it was reverted.
	 */
	async revertOriginalForm(sourceToken: Token, sourceActor: Actor, renderSheet = true) {
		const useWarpGate = game.settings.get(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate");
		if (!sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED)) {
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
		Hooks.callAll(`${CONSTANTS.MODULE_NAME}.revertOriginalForm`, sourceToken, sourceActor, renderSheet);

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
				return;
			}
		}
		try {
			if (useWarpGate) {
				// =============================================
				// THIS IS THE SOLUTION WITH WARP GATE (AVOID THE CREATION OF ACTOR)
				// ===========================================

				let arrayMutationNames: string[] = <string[]>(
					sourceToken.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT)
				);
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
				} else {
					//@ts-ignore
					await warpgate.revert(sourceToken.document, "");
				}
			} else {
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
					if (
						othersActorsToDelete &&
						Array.isArray(othersActorsToDelete) &&
						othersActorsToDelete.length > 0
					) {
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
						Actor.deleteDocuments(idsActorToDelete);
					}
				}
			}

			const isRendered = sourceActor.sheet?.rendered;
			if (isRendered) {
				sourceActor.sheet?.close();
			}
			if (isRendered && renderSheet) {
				original.sheet?.render(isRendered);
			}
		} finally {
			await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
			await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
			await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
			await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);

			await sourceActor.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
			await sourceActor.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
			await sourceActor.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
			await sourceActor.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);

			await sourceToken.document.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
			await sourceToken.document.unsetFlag(
				CONSTANTS.MODULE_NAME,
				PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR
			);
			await sourceToken.document.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
			await sourceToken.document.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);

			await sourceToken.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
			await sourceToken.actor?.unsetFlag(
				CONSTANTS.MODULE_NAME,
				PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR
			);
			await sourceToken.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
			await sourceToken.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);
		}

		return original;
	},

	async renderDialogTransformOptions(
		sourceToken: Token,
		sourceActor: Actor,
		targetActor: Actor,
		explicitName: string,
		animation: string
	) {
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
			const settings = <TransformOptionsGeneric>mergeObject(this.polymorphSettings || {}, options);
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
								} else {
									ANIMATIONS.animationFunctions[animation].fn(sourceToken, tokenUpdatesToTransform);
								}
								await wait(ANIMATIONS.animationFunctions[animation].time);
							}
							info(`${sourceActor.name} turns into a ${targetActor.name}`);
							// TODO show on chat ?
							//await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
							await this.transformInto(
								sourceToken,
								sourceActor,
								targetActor,
								rememberOptions(html),
								false
							);
						},
					},
					wildshape: {
						icon: '<i class="fas fa-paw"></i>',
						label: i18n(`${CONSTANTS.MODULE_NAME}.polymorphWildShape`),
						callback: async (html) => {
							if (sourceToken) {
								if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
									game.macros
										?.getName(ANIMATIONS.animationFunctions[animation].fn)
										//@ts-ignore
										?.execute(sourceToken, tokenUpdatesToTransform);
								} else {
									ANIMATIONS.animationFunctions[animation].fn(sourceToken, tokenUpdatesToTransform);
								}
								await wait(ANIMATIONS.animationFunctions[animation].time);
							}
							info(`${sourceActor.name} turns into a ${targetActor.name}`);
							// TODO show on chat ?
							//await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
							//@ts-ignore
							await this.transformInto(
								sourceToken,
								sourceActor,
								targetActor,
								{
									keepBio: true,
									keepClass: true,
									keepMental: true,
									mergeSaves: true,
									mergeSkills: true,
									transformTokens: rememberOptions(html).transformTokens,
									explicitName: explicitName,
								},
								false
							);
						},
					},
					polymorph: {
						icon: '<i class="fas fa-pastafarianism"></i>',
						label: i18n(`${CONSTANTS.MODULE_NAME}.polymorph`),
						callback: async (html) => {
							if (sourceToken) {
								if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
									game.macros
										?.getName(ANIMATIONS.animationFunctions[animation].fn)
										//@ts-ignore
										?.execute(sourceToken, tokenUpdatesToTransform);
								} else {
									ANIMATIONS.animationFunctions[animation].fn(sourceToken, tokenUpdatesToTransform);
								}
								await wait(ANIMATIONS.animationFunctions[animation].time);
							}
							info(`${sourceActor.name} turns into a ${targetActor.name}`);
							// TODO show on chat ?
							//await ChatMessage.create({content: `${targetActor.name} turns into a ${sourceActor.name}`, speaker:{alias: targetActor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
							//@ts-ignore
							await this.transformInto(
								sourceToken,
								sourceActor,
								targetActor,
								{
									transformTokens: rememberOptions(html).transformTokens,
									explicitName: explicitName,
								},
								false
							);
						},
					},
					self: {
						icon: '<i class="fas fa-eye"></i>',
						label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.polymorphSelf`),
						callback: (html) =>
							this.transformInto(
								sourceToken,
								sourceActor,
								targetActor,
								{
									keepSelf: true,
									transformTokens: rememberOptions(html).transformTokens,
									explicitName: explicitName,
								},
								false
							),
					},
					cancel: {
						icon: '<i class="fas fa-times"></i>',
						label: i18n("Cancel"),
					},
				},
			},
			{
				classes: ["dialog", `${CONSTANTS.MODULE_NAME}`],
				width: 600,
				template: `modules/${CONSTANTS.MODULE_NAME}/templates/polymorph-prompt.hbs`,
			}
		);
	},

	async prepareDataFromTransformOptions(
		originalActorData: ActorData,
		targetActorData: ActorData,
		sourceEffects: any[],
		targetActorImages: string[],
		transformOptions: TransformOptionsGeneric
	) {
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
		const removeAE = transformOptions?.removeAE || false;
		const keepAEOnlyOriginNotEquipment = transformOptions?.keepAEOnlyOriginNotEquipment || false;
		const transformTokens = transformOptions?.transformTokens || true;
		const explicitName = transformOptions?.explicitName || "";

		// Get the original Actor data and the new source data
		// const originalActorData = <any>sourceActor.toJSON();
		//originalActorData.flags.dnd5e = o.flags.dnd5e || {};
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
			removeAE,
			keepAEOnlyOriginNotEquipment,
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

		let d = <any>new Object();
		if (keepSelf) {
			// Keep Self
			mergeObject(d, originalActorData);
		}

		// Prepare data effect
		const newEffectsOri =
			(sourceEffects ? <any[]>sourceEffects : <any[]>(<unknown>originalActorData.effects)) || <any[]>[];
		const newEffects = <any[]>[];
		for (const effect of newEffectsOri) {
			let originS = "";
			let effectS = undefined;
			if (effect.value && Object.prototype.hasOwnProperty.call(effect.value, "origin")) {
				originS = effect.value.origin;
				effectS = effect.value;
			} else if (effect && Object.prototype.hasOwnProperty.call(effect, "origin")) {
				originS = effect.origin;
				effectS = effect;
			} else if (effect.origin && Object.prototype.hasOwnProperty.call(effect, "origin")) {
				originS = effect.origin;
				effectS = effect;
			}
			if (effectS) {
				newEffects.push(effectS);
			}
		}

		// Prepare new data to merge from the source
		d = {
			type: originalActorData.type, // Remain the same actor type
			name: explicitName ? explicitName : `${originalActorData.name} (${targetActorData.name})`, // Append the new shape to your old name
			//@ts-ignore
			system: keepSelf ? originalActorData.system : targetActorData.system, // Get the data model of your new form
			items: keepSelf ? originalActorData.items : targetActorData.items, // Get the items of your new form
			effects: keepSelf
				? newEffects
				: targetActorData.effects
				? newEffects.concat(targetActorData.effects)
				: newEffects, // Combine active effects from both forms
			//@ts-ignore
			// effects: targetActorData.effects ? originalActorData.effects.concat(targetActorData.effects) : originalActorData.effects,
			img: targetActorData.img, // New appearance
			// permission: originalActorData.permission, // Use the original actor permissions
			//@ts-ignore
			ownership: originalActorData.ownership, // Use the original actor permissions
			folder: originalActorData.folder, // Be displayed in the same sidebar folder
			flags: originalActorData.flags, // Use the original actor flags
			// x: sourceToken.x,
			// y: sourceToken.y,
			// token: sourceToken.toObject()
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
		};

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

		// Token appearance updates
		//@ts-ignore
		d.prototypeToken = <PrototypeTokenData>{ name: d.name, texture: {} };
		for (const k of ["width", "height", "alpha", "lockRotation"]) {
			//@ts-ignore
			d.prototypeToken[k] = targetActorData.prototypeToken[k];
		}
		for (const k of ["offsetX", "offsetY", "scaleX", "scaleY", "src", "tint"]) {
			//@ts-ignore
			d.prototypeToken.texture[k] = targetActorData.prototypeToken.texture[k];
		}

		//@ts-ignore
		if (targetActorData.prototypeToken.randomImg) {
			// const images = await target.getTokenImages();
			const images = targetActorImages;
			d.prototypeToken.texture.src = images[Math.floor(Math.random() * images.length)];
		}

		if (!keepSelf) {
			//@ts-ignore
			const vision = keepVision ? originalActorData.prototypeToken : targetActorData.prototypeToken;
			for (const k of ["dimSight", "brightSight", "dimLight", "brightLight", "vision", "sightAngle"]) {
				d.prototypeToken[k] = vision[k];
			}

			// Transfer ability scores
			if (
				//@ts-ignore
				originalActorData.system.abilities &&
				//@ts-ignore
				(originalActorData.system.abilities.length > 0 || originalActorData.system.abilities.size > 0)
			) {
				//@ts-ignore
				const abilities = d.system.abilities;
				for (const k of Object.keys(abilities)) {
					//@ts-ignore
					const oa = originalActorData.system.abilities[k];
					const prof = abilities[k].proficient;
					if (keepPhysical && ["str", "dex", "con"].includes(k)) abilities[k] = oa;
					else if (keepMental && ["int", "wis", "cha"].includes(k)) abilities[k] = oa;
					if (keepSaves) abilities[k].proficient = oa.proficient;
					else if (mergeSaves) abilities[k].proficient = Math.max(prof, oa.proficient);
				}
			}

			// Transfer skills
			//@ts-ignore
			if (
				//@ts-ignore
				originalActorData.system.skills &&
				//@ts-ignore
				(originalActorData.system.skills.length > 0 || originalActorData.system.skills.size > 0)
			) {
				if (keepSkills) {
					//@ts-ignore
					d.system.skills = originalActorData.system.skills;
				} else if (mergeSkills) {
					if (d.system.skills && (d.system.skills.length > 0 || d.system.skills.size > 0)) {
						// eslint-disable-next-line prefer-const
						for (let [k, s] of Object.entries(d.system.skills)) {
							//@ts-ignore
							s.value = Math.max(<number>(<any>s).value, originalActorData.system.skills[k].value);
						}
					}
				}
			}

			// Keep specific items from the original data
			d.items = d.items ? d.items : [];
			if (originalActorData.items && originalActorData.items.size > 0) {
				d.items = d.items.concat(
					originalActorData.items.filter((i) => {
						if (["class", "subclass"].includes(i.type)) {
							return keepClass;
						} else if (i.type === "feat") {
							return keepFeats;
						} else if (i.type === "spell") {
							return keepSpells;
						} else {
							return keepItems;
						}
					})
				);
			}
			// Transfer classes for NPCs
			if (!keepClass && d.system.details.cr) {
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
				} else if (typeof d.system.traits.senses === "string" || d.system.traits.senses instanceof String) {
					d.system.traits.senses = [
						{
							value: d.system.traits.senses,
						},
					];
				} else if (
					typeof d.system.traits.senses === "object" &&
					!Array.isArray(d.system.traits.senses) &&
					d.system.traits.senses !== null
				) {
					d.system.traits.senses = [d.system.traits.senses];
				}

				if (
					//@ts-ignore
					originalActorData.system.traits.senses &&
					//@ts-ignore
					(originalActorData.system.traits.senses.length > 0 ||
						//@ts-ignore
						originalActorData.system.traits.senses.size > 0)
				) {
					if (keepVision) {
						//@ts-ignore
						d.system.traits.senses = originalActorData.system.traits.senses;
					}
				}
			}
			// Not keep active effects
			if (removeAE && !keepAEOnlyOriginNotEquipment) {
				d.effects = [];
			}
			if (d.effects && (d.effects.length > 0 || d.effects.size > 0)) {
				// Keep active effects only origin not equipment
				if (keepAEOnlyOriginNotEquipment) {
					const tokenEffects = foundry.utils.deepClone(newEffects) || [];
					const notEquipItems = ["feat", "spell", "class", "subclass"];
					const tokenEffectsNotEquipment: any[] = [];
					for (const effect of tokenEffects) {
						let originS = "";
						let effectS = undefined;
						if (effect.value && Object.prototype.hasOwnProperty.call(effect.value, "origin")) {
							originS = effect.value.origin;
							effectS = effect.value;
						} else if (effect && Object.prototype.hasOwnProperty.call(effect, "origin")) {
							originS = effect.origin;
							effectS = effect;
						} else if (effect.origin && Object.prototype.hasOwnProperty.call(effect, "origin")) {
							originS = effect.origin;
							effectS = effect;
						}
						//@ts-ignore
						if (effectS && originS && !originS.toLowerCase().includes("item.")) {
							tokenEffectsNotEquipment.push(effectS);
						}
					}
					d.effects = tokenEffectsNotEquipment;
				}
			}
		}
		// Strange bug with fvtt10
		const tokenEffectsCleaned: any[] = [];
		for (const effect of d.effects) {
			const effectTmp = effect.toObject();
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
