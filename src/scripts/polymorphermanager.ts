import type { TokenData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import { ANIMATIONS } from "./animations";
import API from "./api";
import {
	PolymorpherData,
	PolymorpherFlags,
	PolymorpherCompendiumData,
	TokenRevertData,
} from "./automatedPolymorpherModels";
import CONSTANTS from "./constants";
import { error, i18n, info, retrieveActorFromData, should_I_run_this, wait, warn } from "./lib/lib";
import { automatedPolymorpherSocket } from "./socket";

export class PolymorpherManager extends FormApplication {
	// caster: Actor;
	summons: PolymorpherData[];
	// spellLevel: number | undefined;
	actor: Actor;
	token: Token;

	constructor(actor: Actor, token: Token, summonData?: PolymorpherData[]) {
		super({});
		// this.caster = actor;
		this.summons = summonData ? summonData : <PolymorpherData[]>[];
		// this.spellLevel = spellLevel;
		this.actor = actor;

		if (!token) {
			const tokens = actor.getActiveTokens() || [];
			if (tokens.length > 0) {
				this.token = <Token>tokens[0];
			} else {
				//@ts-ignore
				this.token = actor.prototypeToken;
			}
		} else {
			//@ts-ignore
			this.token = token.document ? token : token.object;
		}
	}

	static get defaultOptions() {
		return {
			...super.defaultOptions,
			title: i18n(`${CONSTANTS.MODULE_NAME}.dialogs.polymorpherManager.title`),
			id: "polymorpherManager",
			template: `modules/${CONSTANTS.MODULE_NAME}/templates/polymorphermanager.hbs`,
			resizable: true,
			width: 700,
			height: window.innerHeight > 400 ? 400 : window.innerHeight - 100,
			dragDrop: [{ dragSelector: null, dropSelector: null }],
		};
	}

	getData(): any {
		const data = <any>super.getData();
		data.random = this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM) ?? false;
		data.ordered = this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED) ?? false;

		// const storeOnActorFlag = <boolean>this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR);
		// data.storeonactor =
		//   storeOnActorFlag != null && storeOnActorFlag != undefined
		//     ? storeOnActorFlag
		//     : <boolean>game.settings.get(CONSTANTS.MODULE_NAME, 'storeonactor');

		// Retrieve compendiums with actor
		const currentCompendium = this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.COMPENDIUM) ?? "";
		const compendiumsData: PolymorpherCompendiumData[] = [];
		const compDataNone = <PolymorpherCompendiumData>{
			id: "", // 'world.shapes-compendium'
			name: i18n(`${CONSTANTS.MODULE_NAME}.dialogs.none`),
			selected: currentCompendium ? false : true,
		};
		const compDataNoneNoDelete = <PolymorpherCompendiumData>{
			id: "nonenodelete", // 'world.shapes-compendium'
			name: i18n(`${CONSTANTS.MODULE_NAME}.dialogs.nonenodelete`),
			selected: currentCompendium ? false : true,
		};
		compendiumsData.push(compDataNone);
		compendiumsData.push(compDataNoneNoDelete);
		for (const comp of game.packs.contents) {
			if (comp.metadata.type === "Actor") {
				const compData = <PolymorpherCompendiumData>{
					id: comp.collection, // 'world.shapes-compendium'
					name: comp.metadata.label,
					selected: currentCompendium === comp.collection ? true : false,
				};
				compendiumsData.push(compData);
			}
		}
		data.compendiums = compendiumsData;
		const disable = game.settings.get(CONSTANTS.MODULE_NAME, "disableSettingsForNoGM") && !game.user?.isGM;
		data.showoptionstogm = disable ? false : true;
		return data;
	}

	async activateListeners(html: JQuery<HTMLElement>) {
		html.find("#polymorpher-list").before(
			`<div class="searchbox"><input type="text" class="searchinput" placeholder="Drag and Drop an actor to add it to the list."></div>`
		);
		this.loadPolymorphers();
		html.on("input", ".searchinput", this._onSearch.bind(this));
		html.on("click", "#remove-polymorpher", this._onRemovePolymorpher.bind(this));
		html.on("click", "#summon-polymorpher", this._onSummonPolymorpher.bind(this));
		html.on("click", ".actor-name", this._onOpenSheet.bind(this));
		html.on("dragstart", "#polymorpher", async (event) => {
			event.originalEvent?.dataTransfer?.setData("text/plain", event.currentTarget.dataset.elid);
		});
		html.on("dragend", "#polymorpher", async (event) => {
			event.originalEvent?.dataTransfer?.setData("text/plain", event.currentTarget.dataset.elid);
		});
		html.on("change", "#polymorpher-selectcompendium", async (event) => {
			const currentCompendium = this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.COMPENDIUM) ?? "";
			const changedCompendium = event.currentTarget.value;
			if (changedCompendium != currentCompendium) {
				if (changedCompendium === "nonenodelete") {
					await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.COMPENDIUM, changedCompendium);
					await this.loadPolymorphers();
				} else {
					if (changedCompendium) {
						$('li[data-acompendiumid="' + currentCompendium + '"]').remove();
						await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.COMPENDIUM, changedCompendium);
						await this.loadPolymorphers();
					} else {
						$("#polymorpher-list").empty();
						await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS, []);
						await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.COMPENDIUM, changedCompendium);
						await this.loadPolymorphers();
					}
				}
			}
		});

		html.on("click", ".polymorpher-deleteall", async (event) => {
			event.preventDefault();
			event.stopPropagation();
			await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS, []);
			$("#polymorpher-list").empty();
		});
	}

	_onSearch(event) {
		const search = <string>$(event.currentTarget).val();
		this.element.find(".actor-name").each(function () {
			if ($(this).text().toLowerCase().includes(search.toLowerCase())) {
				$(this).parent().slideDown(200);
			} else {
				$(this).parent().slideUp(200);
			}
		});
	}

	async _onDrop(event) {
		const disable = game.settings.get(CONSTANTS.MODULE_NAME, "disableSettingsForNoGM") && !game.user?.isGM;
		if (disable) {
			warn(`Can't drop any actor while settings 'disableSettingsForNoGM' is enabled`, true);
		}

		let data;
		try {
			data = JSON.parse(event.dataTransfer.getData("text/plain"));
		} catch {
			data = event.dataTransfer.getData("text/plain");
		}
		const li = this.element.find(`[data-elid="${data}"]`);
		if (li.length && !$(event.target).hasClass("nodrop")) {
			const target = $(event.target).closest("li");
			if (target.length && target[0].dataset.elid != data) {
				$(li).remove();
				target.before($(li));
			}
		}
		if (!data?.type) {
			return;
		}
		//@ts-ignore
		if (!data.type === "Actor") {
			return;
		}
		const actorId = data.uuid ? data.uuid.split(".").pop() : undefined;
		const actorToTransformLi = await retrieveActorFromData(data.uuid, actorId, "", "", false);
		if (actorToTransformLi) {
			this.element.find("#polymorpher-list").append(
				this.generateLi(
					{
						uuid: actorToTransformLi.uuid,
						id: <string>actorToTransformLi.id,
						name: <string>actorToTransformLi.name,
						animation: "",
						number: 0,
						defaultsummontype: "",
						compendiumid: "",
						explicitname: "",
					},
					actorToTransformLi
				)
			);
			this.saveData();
		} else {
			warn(`No actor founded for the token with id/name '${data.name}'`, true);
		}
	}

	async _onSummonPolymorpher(event) {
		this.close(); // this.minimize();
		const animation = <string>$(event.currentTarget.parentElement.parentElement).find(".anim-dropdown").val();
		const aUuid = event.currentTarget.dataset.auuid;
		const aId = event.currentTarget.dataset.aid;
		const aName = event.currentTarget.dataset.aname;
		const aCompendiumId = event.currentTarget.dataset.acompendiumid;
		const aExplicitName = event.currentTarget.dataset.aexplicitname;
		let actorToTransform: Actor | undefined = undefined;
		actorToTransform = <Actor>await retrieveActorFromData(aUuid, aId, aName, aCompendiumId, true);
		if (actorToTransform && should_I_run_this(actorToTransform)) {
			// DO NOTHING
		} else {
			const actorToTransformId = await automatedPolymorpherSocket.executeAsGM(
				"retrieveAndPrepareActor",
				aUuid,
				aId,
				aName,
				aCompendiumId,
				true,
				this.actor.id,
				game.user?.id
			);
			actorToTransform = <Actor>(
				await retrieveActorFromData(actorToTransformId, undefined, undefined, false, aUuid)
			);
		}
		if (!actorToTransform) {
			warn(
				`The actor you try to polimorphing not exists anymore, please set up again the actor on the polymorpher manager`,
				true
			);
			return;
		}

		let tokenFromTransform = <Token>canvas.tokens?.placeables.find((t: Token) => {
				return t.actor?.id === this.actor.id;
			}) || undefined;
		if (this.token) {
			tokenFromTransform = this.token;
		}
		// Get the target actor
		if (!actorToTransform) {
			warn(`No target actor is been found`);
			return;
		}

		// Prepare flag for revert ???
		const updatesForRevert = <TokenRevertData[]>(
			this.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
		)
			? <TokenRevertData[]>(
					this.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
			  )
			: <TokenRevertData[]>[];
		updatesForRevert.push({
			//@ts-ignore
			actorId: <string>this.token.document.actorId,
			id: <string>this.token.document.id,
		});
		await this.actor?.setFlag(
			CONSTANTS.MODULE_NAME,
			PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR,
			updatesForRevert
		);
		const dialog = await API.renderDialogTransformOptionsImpl(
			tokenFromTransform,
			this.actor,
			actorToTransform,
			aExplicitName,
			animation
		);
		if (game.settings.get(CONSTANTS.MODULE_NAME, "autoclose")) {
			this.close();
		} else {
			this.maximize();
		}
		dialog.render(true);
	}

	async _onRemovePolymorpher(event) {
		Dialog.confirm({
			title: i18n(`${CONSTANTS.MODULE_NAME}.dialogs.polymorpherManager.confirm.title`),
			content: i18n(`${CONSTANTS.MODULE_NAME}.dialogs.polymorpherManager.confirm.content`),
			yes: () => {
				event.currentTarget.parentElement.remove();
				this.saveData();
			},
			no: () => {
				// DO NOTHING
			},
			defaultYes: false,
		});
	}

	async _onOpenSheet(event) {
		const aId = event.currentTarget.parentElement.dataset.aid;
		const aUuid = event.currentTarget.parentElement.dataset.auuid;
		const aName = event.currentTarget.parentElement.dataset.aname;
		const aCompendiumId = event.currentTarget.dataset.acompendiumid;
		const aExplicitName = event.currentTarget.dataset.aexplicitname;
		const actorFromTransform = await retrieveActorFromData(aUuid, aId, aName, aCompendiumId, false);
		if (actorFromTransform) {
			actorFromTransform.sheet?.render(true);
		}
	}

	async _onChangeExplicitName(event) {
		const explicitName = event.currentTarget.parentElement.dataset.aexplicitname;
		// Tretrieve attribute data-aexplicitname on the warpgate button
		$(
			event.currentTarget.parentElement.find(".warpgate-btn").each(function () {
				$(this).attr("data-aexplicitname", explicitName);
			})
		);
	}

	async loadPolymorphers() {
		const data: PolymorpherData[] =
			<PolymorpherData[]>this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];

		const namesAlreadyImportedFromCompendium: string[] = [];
		const currentCompendium = <string>this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.COMPENDIUM) ?? "";
		if (currentCompendium && currentCompendium != "none" && currentCompendium != "nonenodelete") {
			const pack = game.packs.get(currentCompendium);
			if (pack) {
				await pack.getIndex();
				for (const entityComp of pack.index) {
					const actorComp = <Actor>await pack.getDocument(entityComp._id);
					if (actorComp) {
						const polyDataTmp = data.find((a) => {
							return a.id === actorComp.id || a.name === actorComp.name;
						});
						if (polyDataTmp) {
							this.element.find("#polymorpher-list").append(this.generateLi(polyDataTmp, actorComp));
							namesAlreadyImportedFromCompendium.push(<string>actorComp.name);
						} else {
							const polydata = <PolymorpherData>{
								uuid: actorComp.uuid,
								id: actorComp.id,
								name: actorComp.name,
								animation: "",
								number: 1,
								defaultsummontype: "",
								compendiumid: currentCompendium,
							};
							this.element.find("#polymorpher-list").append(this.generateLi(polydata, actorComp));
							namesAlreadyImportedFromCompendium.push(<string>actorComp.name);
						}
					}
				}
			}
		}

		if (data) {
			for (const polymorpher of data) {
				const aUuid = polymorpher.uuid;
				const aId = polymorpher.id;
				const aName = polymorpher.name;
				const aCompendiumId = polymorpher.compendiumid;
				const aExplicitName = polymorpher.explicitname;
				const actorToTransformLi = await retrieveActorFromData(aUuid, aId, aName, aCompendiumId, false);
				if (!actorToTransformLi) {
					warn(`No actor founded for the token with id/name '${polymorpher.name}'`, true);
					continue;
				}
				if (!namesAlreadyImportedFromCompendium.includes(polymorpher.name)) {
					this.element.find("#polymorpher-list").append(this.generateLi(polymorpher, actorToTransformLi));
				}
			}
		}
	}

	generateLi(data: PolymorpherData, actorToTransformLi: Actor) {
		if (!actorToTransformLi) {
			return "";
		}
		const disable = game.settings.get(CONSTANTS.MODULE_NAME, "disableSettingsForNoGM") && !game.user?.isGM;
		const restricted = game.settings.get(CONSTANTS.MODULE_NAME, "restrictOwned");
		if (restricted && !actorToTransformLi.isOwner) return "";
		const $li = $(`
	    <li id="polymorpher"
        class="polymorpher-item"
		data-auuid="${actorToTransformLi.uuid}"
        data-aid="${actorToTransformLi.id}"
        data-aname="${actorToTransformLi.name}"
        data-acompendiumid="${data.compendiumid ?? ""}"
        data-aexplicitname="${data.explicitname ?? actorToTransformLi.name}"
        data-elid="${actorToTransformLi.id}"
        draggable="true">

        <div class="summon-btn">
          <img
            class="actor-image"
            src="${actorToTransformLi.img}" alt="">
          <div
            class="warpgate-btn"
            id="summon-polymorpher"
			data-auuid="${actorToTransformLi.uuid}"
            data-aid="${actorToTransformLi.id}"
            data-aname="${actorToTransformLi.name}"
            data-acompendiumid="${data.compendiumid}"
            data-aexplicitname="${data.explicitname ?? actorToTransformLi.name}"
            data-elid="${actorToTransformLi.id}">
          </div>
        </div>
    	  <span class="actor-name">${actorToTransformLi.name}</span>
        <input
            id="explicitname"
            name="explicitname"
            class="explicitname"
            type="text"
			${disable ? " readonly " : " "}
            value="${data.explicitname ?? actorToTransformLi.name}"></input>
        <select class="anim-dropdown" ${disable ? " disabled " : " "}>
            ${this.getAnimations(data.animation)}
        </select>
        <select
          id="automated-polymorpher.defaultSummonType"
          class="defaultSummonType" name="defaultSummonType"
          data-dtype="String"
          is="ms-dropdown-ap" 
		  ${disable ? " disabled " : " "}>
          ${this.getDefaultSummonTypes(data.defaultsummontype, data)}
        </select>
		${disable ? "" : '<i id="remove-polymorpher" class="fas fa-trash"></i>'}
      </li>`);
		//    <i id="advanced-params" class="fas fa-edit"></i>
		return $li;
	}

	getAnimations(anim) {
		let animList = "";
		for (const [group, animations] of Object.entries(ANIMATIONS.animations)) {
			const localGroup = i18n(`${CONSTANTS.MODULE_NAME}.groups.${group}`);
			animList += `<optgroup label="${
				localGroup == `${CONSTANTS.MODULE_NAME}.groups.${group}` ? group : localGroup
			}">`;
			for (const a of <any[]>animations) {
				animList += `<option value="${a.key}" ${a.key == anim ? "selected" : ""}>${a.name}</option>`;
			}
			animList += "</optgroup>";
		}
		return animList;
	}

	getDefaultSummonTypes(defaultsummontype: string, a: PolymorpherData) {
		let animList = "";
		const typesArray = [
			"",
			`${CONSTANTS.MODULE_NAME}.polymorphWildShape`,
			`${CONSTANTS.MODULE_NAME}.polymorph`,
			`${CONSTANTS.MODULE_NAME}.polymorphSelf`,
		];
		for (const [index, type] of Object.entries(typesArray)) {
			animList += `<option value="${type}" ${a.defaultsummontype === type ? "selected" : ""}>${i18n(
				type
			)}</option>`;
		}
		return animList;
	}

	async wait(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async saveData() {
		if (this.element.parent().length === 0) {
			return;
		}
		let data: PolymorpherData[] = [];
		for (const polymorpher of this.element.find(".polymorpher-item")) {
			data.push({
				uuid: <string>polymorpher.dataset.auuid,
				id: <string>polymorpher.dataset.aid,
				name: <string>polymorpher.dataset.aname,
				animation: <string>$(polymorpher).find(".anim-dropdown").val(),
				number: <number>$(polymorpher).find("#polymorpher-number-val").val(),
				defaultsummontype: <string>$(polymorpher).find(".defaultSummonType").val(),
				compendiumid: <string>polymorpher.dataset.acompendiumid,
				explicitname: <string>$(polymorpher).find(".explicitname").val(),
			});
		}

		const isOrdered = <string>this.element.parent().find(".polymorpher-ordered").val() === "true" ?? false;
		const isRandom = <string>this.element.parent().find(".polymorpher-random").val() === "true" ?? false;
		// const isStoreonactor = <string>this.element.parent().find('.polymorpher-storeonactor').val() === 'true' ?? false;
		const currentCompendium = <string>this.element.parent().find(".polymorpher-selectcompendium").val();
		if (isRandom && isOrdered) {
			warn(`Attention you can't enable the 'ordered' and the 'random' both at the same time`);
		}

		if (
			currentCompendium &&
			currentCompendium != "none" &&
			currentCompendium != "nonenodelete" &&
			currentCompendium != this.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.COMPENDIUM)
		) {
			// Reference a Compendium pack by it's callection ID
			const pack = <CompendiumCollection<CompendiumCollection.Metadata>>(
				game.packs.find((p) => p.collection === currentCompendium)
			);
			if (!pack) {
				error(`No pack is found with id '${currentCompendium}'`, true);
			} else {
				if (!pack.indexed) {
					await pack.getIndex();
				}
				data = [];
				const compendium = <StoredDocument<Actor>[]>await pack?.getDocuments();
				//.sort((a, b) => a.name?.localeCompare(b.name));
				for (const shapeOption of compendium) {
					const polymorpher = <Actor>shapeOption;
					// TODO we can add some filter
					data.push({
						uuid: <string>polymorpher.uuid,
						id: <string>polymorpher.id,
						name: <string>polymorpher.name,
						animation: <string>$(polymorpher).find(".anim-dropdown").val(),
						number: <number>$(polymorpher).find("#polymorpher-number-val").val(),
						defaultsummontype: <string>$(polymorpher).find(".defaultSummonType").val(),
						compendiumid: <string>currentCompendium,
						explicitname: <string>$(polymorpher).find(".explicitname").val(),
					});
				}
			}
		}

		await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS, data);

		await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM, isRandom);
		await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED, isOrdered);
		// await this.actor.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR, isStoreonactor);
	}

	//@ts-ignore
	close(noSave = false) {
		if (!noSave) {
			this.saveData();
		}
		super.close();
	}

	_updateObject(event): any {
		// DO NOTHING
	}

	async fastSummonPolymorpher(
		polymorpherData: PolymorpherData,
		animationExternal = { sequence: undefined, timeToWait: 0 }
	) {
		this.close(); // this.minimize();
		const animation = polymorpherData.animation;
		const aUuid = polymorpherData.uuid;
		const aId = polymorpherData.id;
		const aName = polymorpherData.name;
		const aCompendiumId = polymorpherData.compendiumid;
		const aExplicitName = polymorpherData.explicitname;
		let actorToTransform: Actor | undefined = undefined;
		actorToTransform = <Actor>await retrieveActorFromData(aUuid, aId, aName, aCompendiumId, true);
		if (actorToTransform && should_I_run_this(actorToTransform)) {
			// DO NOTHING
		} else {
			const actorToTransformId = await automatedPolymorpherSocket.executeAsGM(
				"retrieveAndPrepareActor",
				aUuid,
				aId,
				aName,
				aCompendiumId,
				true,
				this.actor.id,
				game.user?.id
			);
			actorToTransform = <Actor>(
				await retrieveActorFromData(aUuid, actorToTransformId, undefined, undefined, false)
			);
		}
		if (!actorToTransform) {
			warn(
				`The actor you try to polymorphism not exists anymore, please set up again the actor on the polymorpher manager`,
				true
			);
			return;
		}

		//@ts-ignore
		const tokenDataToTransform = <TokenDocument>await actorToTransform.getTokenDocument();

		let tokenFromTransform = <Token>canvas.tokens?.placeables.find((t: Token) => {
				return t.actor?.id === this.actor.id;
			}) || undefined;
		if (this.token) {
			tokenFromTransform = this.token;
		}
		// Get the target actor
		if (!actorToTransform) {
			return;
		}

		// const canPolymorph = game.user?.isGM || (this.actor.isOwner && game.settings.get('dnd5e', 'allowPolymorphing'));
		// if (!canPolymorph) {
		//   warn(`You mus enable the setting 'allowPolymorphing' for the dnd5e system`, true);
		//   return false;
		// }
		// // Define a function to record polymorph settings for future use
		// const rememberOptions = (html) => {
		//   const options = {};
		//   html.find('input').each((i, el) => {
		//     options[el.name] = el.checked;
		//   });
		//   const settings = mergeObject(game.settings.set(CONSTANTS.MODULE_NAME, 'polymorphSettings', settings) || {}, options);
		//   game.settings.set(CONSTANTS.MODULE_NAME, 'polymorphSettings', settings);
		//   return settings;
		// };

		// Prepare flag for revert ???
		/*
      let updatesForRevert: any = {};
      if (!this.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.UPDATES_FOR_REVERT)) {
        updatesForRevert = {
          tokenData: this.token,
          actorData: this.actor,
        };
      } else {
        updatesForRevert = this.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.UPDATES_FOR_REVERT);
      }
      await this.actor?.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.UPDATES_FOR_REVERT, updatesForRevert);
      */

		const updatesForRevert = <TokenRevertData[]>(
			this.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
		)
			? <TokenRevertData[]>(
					this.actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR)
			  )
			: <TokenRevertData[]>[];
		updatesForRevert.push({
			//@ts-ignore
			actorId: <string>this.token.document.actorId,
			id: <string>this.token.document.id,
		});
		await this.actor?.setFlag(
			CONSTANTS.MODULE_NAME,
			PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR,
			updatesForRevert
		);

		if (polymorpherData.defaultsummontype === `${CONSTANTS.MODULE_NAME}.polymorphAcceptSettings`) {
			if (tokenFromTransform) {
				if (animationExternal && animationExternal.sequence) {
					//@ts-ignore
					await animationExternal.sequence.play();
					await wait(animationExternal.timeToWait);
				} else if (animation) {
					if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
						//@ts-ignore
						game.macros
							?.getName(ANIMATIONS.animationFunctions[animation].fn)
							//@ts-ignore
							?.execute({ tokenFromTransform, tokenDataToTransform });
					} else {
						ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
					}
					await wait(ANIMATIONS.animationFunctions[animation].time);
				}
			}
			info(`${this.actor.name} turns into a ${actorToTransform.name}`);
			// TODO show on chat ?
			//await ChatMessage.create({content: `${this.actor.name} turns into a ${actorToTransform.name}`, speaker:{alias: this.actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
			await API.transformInto(
				tokenFromTransform,
				this.actor,
				actorToTransform,
				<any>{
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
					transformTokens: true,
					explicitName: aExplicitName,
				},
				false,
				<string>game.user?.id
			);
		} else if (polymorpherData.defaultsummontype === `${CONSTANTS.MODULE_NAME}.polymorphWildShape`) {
			if (tokenFromTransform) {
				if (animationExternal && animationExternal.sequence) {
					//@ts-ignore
					await animationExternal.sequence.play();
					await wait(animationExternal.timeToWait);
				} else if (animation) {
					if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
						//@ts-ignore
						game.macros
							?.getName(ANIMATIONS.animationFunctions[animation].fn)
							//@ts-ignore
							?.execute(tokenFromTransform, tokenDataToTransform);
					} else {
						ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
					}
					await wait(ANIMATIONS.animationFunctions[animation].time);
				}
			}
			info(`${this.actor.name} turns into a ${actorToTransform.name}`);
			// TODO show on chat ?
			//await ChatMessage.create({content: `${this.actor.name} turns into a ${actorToTransform.name}`, speaker:{alias: this.actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
			await API.transformInto(
				tokenFromTransform,
				this.actor,
				actorToTransform,
				<any>{
					keepBio: true,
					keepClass: true,
					keepMental: true,
					mergeSaves: true,
					mergeSkills: true,
					keepEquipmentAE: false,
					transformTokens: true,
					explicitName: aExplicitName,
				},
				false,
				<string>game.user?.id
			);
		} else if (polymorpherData.defaultsummontype === `${CONSTANTS.MODULE_NAME}.polymorph`) {
			if (tokenFromTransform) {
				if (animationExternal && animationExternal.sequence) {
					//@ts-ignore
					await animationExternal.sequence.play();
					await wait(animationExternal.timeToWait);
				} else if (animation) {
					if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
						//@ts-ignore
						game.macros
							?.getName(ANIMATIONS.animationFunctions[animation].fn)
							//@ts-ignore
							?.execute(tokenFromTransform, tokenDataToTransform);
					} else {
						ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
					}
					await wait(ANIMATIONS.animationFunctions[animation].time);
				}
			}
			info(`${this.actor.name} turns into a ${actorToTransform.name}`);
			// TODO show on chat ?
			//await ChatMessage.create({content: `${this.actor.name} turns into a ${actorToTransform.name}`, speaker:{alias: this.actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
			await API.transformInto(
				tokenFromTransform,
				this.actor,
				actorToTransform,
				<any>{
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
					transformTokens: true,
					explicitName: aExplicitName,
				},
				false,
				<string>game.user?.id
			);
		} else if (polymorpherData.defaultsummontype === `${CONSTANTS.MODULE_NAME}.polymorphSelf`) {
			if (tokenFromTransform) {
				if (animationExternal && animationExternal.sequence) {
					//@ts-ignore
					await animationExternal.sequence.play();
					await wait(animationExternal.timeToWait);
				} else if (animation) {
					if (typeof ANIMATIONS.animationFunctions[animation].fn == "string") {
						//@ts-ignore
						game.macros
							?.getName(ANIMATIONS.animationFunctions[animation].fn)
							//@ts-ignore
							?.execute(tokenFromTransform, tokenDataToTransform);
					} else {
						ANIMATIONS.animationFunctions[animation].fn(tokenFromTransform, tokenDataToTransform);
					}
					await wait(ANIMATIONS.animationFunctions[animation].time);
				}
			}
			info(`${this.actor.name} turns into a ${actorToTransform.name}`);
			// TODO show on chat ?
			//await ChatMessage.create({content: `${this.actor.name} turns into a ${actorToTransform.name}`, speaker:{alias: this.actor.name}, type: CONST.CHAT_MESSAGE_TYPES.OOC});
			await API.transformInto(
				tokenFromTransform,
				this.actor,
				actorToTransform,
				<any>{
					keepSelf: true,
					transformTokens: true,
					explicitName: aExplicitName,
				},
				false,
				<string>game.user?.id
			);
		} else {
			warn(
				`No default summon type is setted for any polymorphing actor on the list associated to this actor ${actorToTransform.name}`,
				true
			);
		}
	}
}

export class SimplePolymorpherManager extends PolymorpherManager {
	// caster: Actor;
	// summons: any[];
	// spellLevel: number;

	constructor(actor: Actor, token: Token, summonData) {
		super(actor, token, summonData);
		// this.caster = actor;
		// this.summons = summonData;
		// this.spellLevel = spellLevel;
	}

	async activateListeners(html) {
		for (const summon of this.summons) {
			const aUuid = summon.uuid;
			const aId = summon.id;
			const aName = summon.name;
			const aCompendiumId = summon.compendiumid;
			const actorToTransformLi = await retrieveActorFromData(aUuid, aId, aName, aCompendiumId, false);
			if (actorToTransformLi) {
				this.element.find("#polymorpher-list").append(this.generateLi(summon, actorToTransformLi));
			} else {
				warn(`No actor founded for the token with id/name '${summon.name}'`, true);
			}
		}

		html.on("click", "#summon-polymorpher", this._onSummonPolymorpher.bind(this));
		html.on("click", ".actor-name", this._onOpenSheet.bind(this));
		// TODO maybe i don't need these
		html.on("change", "#explicitname", this._onChangeExplicitName.bind(this));
		html.on("input", "#explicitname", this._onChangeExplicitName.bind(this));
	}

	async _onDrop(event) {
		const disable = game.settings.get(CONSTANTS.MODULE_NAME, "disableSettingsForNoGM") && !game.user?.isGM;
		if (disable) {
			warn(`Can't drop any actor while settings 'disableSettingsForNoGM' is enabled`, true);
		}
	}

	close() {
		super.close(true);
	}
}
