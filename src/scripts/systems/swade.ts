import { ANIMATIONS } from "../animations";
import {
	PolymorpherFlags,
	TokenRevertData,
	transformationPresets,
	TransformOptionsGeneric,
} from "../automatedPolymorpherModels";
import CONSTANTS from "../constants";
import { debug, i18n, info, log, wait, warn } from "../lib/lib";
import { polymorphWithWarpgate } from "../lib/warpgate";
import { polymorphWithActorLinked, revertOriginalFormImpl } from "../lib/polymorph-utilities";

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
	async transformInto(
		sourceToken: Token,
		sourceActor: Actor,
		targetActor: Actor,
		transformOptions: TransformOptionsGeneric | undefined = undefined,
		renderSheet = true,
		externalUserId = <string>game.user?.id
	): Promise<TokenDocument | undefined> {
		const useWarpGate = game.settings.get(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate");
		// const transformTokens = transformOptions?.transformTokens || true;

		// Get the original Actor data and the new source data
		const originalActorData = <any>sourceActor.toObject(true);
		const targetActorData = <any>targetActor.toObject(true);

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

		// Set new data flags
		// TODO FIND A BTTER CODE FOR THIS)
		if (!sourceToken.actor) {
			setProperty(sourceToken, `actor`, {});
		}
		//@ts-ignore
		if (!sourceToken.actor.flags) {
			setProperty(<any>sourceToken.actor, `flags`, {});
		}
		//@ts-ignore
		if (!sourceToken.actor.flags[CONSTANTS.MODULE_NAME]) {
			//@ts-ignore
			setProperty(<any>sourceToken.actor.flags, `${CONSTANTS.MODULE_NAME}`, {});
		}
		setProperty(
			d.flags,
			`${CONSTANTS.MODULE_NAME}`,
			//@ts-ignore
			getProperty(<any>sourceToken.actor.flags, `${CONSTANTS.MODULE_NAME}`)
		);
		//setProperty(d.flags, `${CONSTANTS.MODULE_NAME}`, getProperty(actorThis.flags, `${CONSTANTS.MODULE_NAME}`));
		//@ts-ignore
		mergeObject(d.flags, originalActorData.flags);
		if (
			//@ts-ignore
			!getProperty(sourceToken.actor?.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`) ||
			!getProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`)
		) {
			setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.ORIGINAL_ACTOR}`, originalActorData.id);
		}
		setProperty(d.flags, `${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.IS_POLYMORPHED}`, true);

		let previousTokenData =
			<TokenRevertData[]>(
				getProperty(
					originalActorData.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR}`
				)
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
		let arrayMutationNames: string[] = <string[]>getProperty(
			//@ts-ignore
			<Actor>sourceToken.actor.flags,
			`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`
		);
		if (!arrayMutationNames || arrayMutationNames.length == 0) {
			arrayMutationNames = <string[]>getProperty(
					//@ts-ignore
					sourceActor.flags,
					`${CONSTANTS.MODULE_NAME}.${PolymorpherFlags.MUTATION_NAMES_FOR_REVERT}`
				) || [];
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
			return await polymorphWithWarpgate(sourceActor, targetActor, d);
		} else {
			// =============================================
			// THIS IS THE DND5E SOLUTION WITh THE CREATION OF ACTOR)
			// ===========================================
			return await polymorphWithActorLinked(
				sourceToken,
				sourceActor,
				targetActor,
				d,
				externalUserId,
				renderSheet
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
	async revertOriginalForm(sourceToken: Token, sourceActor: Actor, renderSheet = true) {
		return revertOriginalFormImpl(sourceToken, sourceActor, renderSheet);
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

		const i18nPolymorphEffectSettingsTmp: any = {};
		for (const key in this.i18nPolymorphEffectSettings) {
			const value = i18n(this.i18nPolymorphEffectSettings[key]);
			i18nPolymorphEffectSettingsTmp[key] = value;
		}

		// Create and render the Dialog
		return new Dialog(
			{
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
								false,
								<string>game.user?.id
							);
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
								foundry.utils.mergeObject(transformationPresets.wildshape.options, {
									transformTokens: rememberOptions(html).transformTokens,
								}),
								false,
								<string>game.user?.id
							);
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
								foundry.utils.mergeObject(transformationPresets.polymorph.options, {
									transformTokens: rememberOptions(html).transformTokens,
								}),
								false,
								<string>game.user?.id
							);
						},
					},
					self: {
						icon: transformationPresets.polymorphSelf.icon,
						label: i18n(transformationPresets.polymorphSelf.label),
						callback: async (html) => {
							await this.transformInto(
								sourceToken,
								sourceActor,
								targetActor,
								foundry.utils.mergeObject(transformationPresets.polymorphSelf.options, {
									transformTokens: rememberOptions(html).transformTokens,
								}),
								false,
								<string>game.user?.id
							);
						},
					},
					cancel: {
						icon: '<i class="fas fa-times"></i>',
						label: i18n("Cancel"),
					},
				},
			},
			{
				classes: ["dialog", `${CONSTANTS.MODULE_NAME}`],
				width: 900,
				template: `modules/${CONSTANTS.MODULE_NAME}/templates/polymorph-prompt.hbs`,
			}
		);
	},

	async prepareDataFromTransformOptions(
		originalActorData: Actor,
		targetActorData: Actor,
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
		//@ts-ignore
		if (!getProperty(originalActorData.flags, `${CONSTANTS.MODULE_NAME}`)) {
			try {
				//@ts-ignore
				setProperty(originalActorData.flags, `${CONSTANTS.MODULE_NAME}`, {});
			} catch (e) {
				//@ts-ignore
				originalActorData.flags[CONSTANTS.MODULE_NAME] = {};
			}
		}
		//@ts-ignore
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
		let d = foundry.utils.mergeObject(
			{
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
				//@ts-ignore
				flags: originalActorData.flags, // Use the original actor flags
				prototypeToken: {
					name: `${originalActorData.name} (${targetActorData.name})`,
					texture: {},
					sight: {},
					detectionModes: [],
				}, // Set a new empty token
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
			},
			keepSelf ? originalActorData : {}
		); // Keeps most of original actor

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
			//@ts-ignore
			d.items = d.items ? (d.items.contents ? d.items.contents : d.items) : [];
			if (originalActorData.items && originalActorData.items.size > 0) {
				//@ts-ignore
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

			// Remove active effects
			const oEffects = foundry.utils.deepClone(d.effects);
			const originEffectIds = new Set(
				oEffects
					.filter((effect) => {
						return !effect.origin || effect.origin === this.uuid;
					})
					.map((e) => e._id)
			);
			d.effects = d.effects.filter((e) => {
				if (keepAE) {
					return true;
				}
				const origin =
					//@ts-ignore
					e.origin?.startsWith("Actor") || e.origin?.startsWith("Item") ? fromUuidSync(e.origin) : undefined;
				if (!origin) {
					warn(`The effect ${e.label} has a invalid origin ${e.origin} is not passed to the target actor`);
					return false;
				}
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

		const tokenEffectsCleaned: any[] = [];
		for (const effect of d.effects) {
			let effectTmp = undefined;
			try {
				effectTmp = effect.toObject(false);
			} catch (e) {
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
