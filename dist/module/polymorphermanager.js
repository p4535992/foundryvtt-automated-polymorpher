import { i18n } from "../automated-polymorpher.js";
import { APCONSTS } from "./config.js";
import { getGame } from "./settings.js";
export class PolymorpherManager extends FormApplication {
    constructor(actor) {
        super({});
        this.actor = actor;
    }
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            title: i18n('AP.dialogs.polymorpherManager.title'),
            id: 'polymorpherManager',
            template: `modules/${APCONSTS.MN}/templates/polymorphermanager.hbs`,
            resizable: true,
            width: 300,
            height: window.innerHeight > 400 ? 400 : window.innerHeight - 100,
            dragDrop: [{ dragSelector: null, dropSelector: null }],
        };
    }
    getData() {
        return {};
    }
    async activateListeners(html) {
        html
            .find('#polymorpher-list')
            .before(`<div class="searchbox"><input type="text" class="searchinput" placeholder="Drag and Drop an actor to add it to the list."></div>`);
        this.loadPolymorphers();
        html.on('input', '.searchinput', this._onSearch.bind(this));
        html.on('click', '#remove-polymorpher', this._onRemovePolymorpher.bind(this));
        html.on('click', '#summon-polymorpher', this._onSummonPolymorpher.bind(this));
        html.on('click', '.actor-name', this._onOpenSheet.bind(this));
        html.on('dragstart', '#polymorpher', async (event) => {
            event.originalEvent.dataTransfer.setData('text/plain', event.currentTarget.dataset.elid);
        });
        html.on('dragend', '#polymorpher', async (event) => {
            event.originalEvent.dataTransfer.setData('text/plain', event.currentTarget.dataset.elid);
        });
    }
    _onSearch(event) {
        const search = $(event.currentTarget).val();
        this.element.find('.actor-name').each(function () {
            if ($(this).text().toLowerCase().includes(search.toLowerCase())) {
                $(this).parent().slideDown(200);
            }
            else {
                $(this).parent().slideUp(200);
            }
        });
    }
    _onDrop(event) {
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        }
        catch {
            data = event.dataTransfer.getData('text/plain');
        }
        const li = this.element.find(`[data-elid="${data}"]`);
        if (li.length && !$(event.target).hasClass('nodrop')) {
            const target = $(event.target).closest('li');
            if (target.length && target[0].dataset.elid != data) {
                $(li).remove();
                target.before($(li));
            }
        }
        if (!data?.type) {
            // || data?.type !== 'Actor'){
            return;
        }
        this.element.find('#polymorpher-list').append(this.generateLi({ id: data.id }));
        this.saveData();
    }
    async _onSummonPolymorpher(event) {
        this.minimize();
        const animation = $(event.currentTarget.parentElement.parentElement).find('.anim-dropdown').val();
        const aId = event.currentTarget.dataset.aid;
        const actor = getGame().actors?.get(aId);
        const duplicates = $(event.currentTarget.parentElement.parentElement).find('#polymorpher-number-val').val();
        const tokenData = await actor.getTokenData();
        const canPolymorph = getGame().user?.isGM || (this.actor.isOwner && getGame().settings.get('dnd5e', 'allowPolymorphing'));
        if (!canPolymorph)
            return false;
        // Get the target actor
        let sourceActor = actor;
        // if (data.pack) {
        //   const pack = getGame().packs.find(p => p.collection === data.pack);
        //   sourceActor = await pack.getEntity(data.id);
        // } else {
        //   sourceActor = getGame().actors.get(data.id);
        // }
        if (!sourceActor)
            return;
        // Define a function to record polymorph settings for future use
        const rememberOptions = (html) => {
            const options = {};
            html.find('input').each((i, el) => {
                options[el.name] = el.checked;
            });
            const settings = mergeObject(getGame().settings.get('dnd5e', 'polymorphSettings') || {}, options);
            getGame().settings.set('dnd5e', 'polymorphSettings', settings);
            return settings;
        };
        // Create and render the Dialog
        return new Dialog({
            title: i18n('DND5E.PolymorphPromptTitle'),
            //@ts-ignore
            content: {
                options: getGame().settings.get('dnd5e', 'polymorphSettings'),
                //@ts-ignore
                i18n: CONFIG.DND5E.polymorphSettings,
                isToken: this.actor.isToken,
            },
            default: 'accept',
            buttons: {
                accept: {
                    icon: '<i class="fas fa-check"></i>',
                    label: i18n('DND5E.PolymorphAcceptSettings'),
                    callback: async (html) => {
                        //@ts-ignore
                        await this.actor.transformInto(
                        // await this._transformIntoCustom(
                        sourceActor, rememberOptions(html));
                        if (getGame().settings.get(APCONSTS.MN, 'autoclose'))
                            this.close();
                        else
                            this.maximize();
                    },
                },
                wildshape: {
                    icon: '<i class="fas fa-paw"></i>',
                    label: i18n('DND5E.PolymorphWildShape'),
                    callback: async (html) => {
                        //@ts-ignore
                        await this.actor.transformInto(
                        // await this._transformIntoCustom(
                        sourceActor, {
                            keepBio: true,
                            keepClass: true,
                            keepMental: true,
                            mergeSaves: true,
                            mergeSkills: true,
                            transformTokens: rememberOptions(html).transformTokens,
                        });
                        if (getGame().settings.get(APCONSTS.MN, 'autoclose'))
                            this.close();
                        else
                            this.maximize();
                    },
                },
                polymorph: {
                    icon: '<i class="fas fa-pastafarianism"></i>',
                    label: i18n('DND5E.Polymorph'),
                    callback: async (html) => {
                        //@ts-ignore
                        await this.actor.transformInto(
                        // await this._transformIntoCustom(
                        sourceActor, {
                            transformTokens: rememberOptions(html).transformTokens,
                        });
                        if (getGame().settings.get(APCONSTS.MN, 'autoclose'))
                            this.close();
                        else
                            this.maximize();
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: i18n('Cancel'),
                },
            },
        }, {
            classes: ['dialog', 'dnd5e'],
            width: 600,
            template: 'systems/dnd5e/templates/apps/polymorph-prompt.html',
        }).render(true);
        /*
        const posData = await warpgate.crosshairs.show(
          Math.max(tokenData.width, tokenData.height) * tokenData.scale,
          'modules/automated-polymorpher/assets/black-hole-bolas.webp',
          '',
        );
        if (posData.cancelled) {
          this.maximize();
          return;
        }
        if (typeof APCONSTS.animationFunctions[animation].fn == 'string') {
          getGame().macros.getName(APCONSTS.animationFunctions[animation].fn).execute(posData, tokenData);
        } else {
          APCONSTS.animationFunctions[animation].fn(posData, tokenData);
        }
        await this.wait(APCONSTS.animationFunctions[animation].time);
        //get custom data macro
        const customTokenData = await getGame().macros
          .getName(`AP_Polymorpher_Macro(${actor.data.name})`)
          ?.execute({
            summon: actor,
            spellLevel: this.spellLevel || 0,
            duplicates: duplicates,
            assignedActor: this.caster || getGame().user.character || _token.actor,
          });
        warpgate.spawnAt({ x: posData.x, y: posData.y }, tokenData, customTokenData || {}, {}, { duplicates });
        if (getGame().settings.get(APCONSTS.MN, 'autoclose')) this.close();
        else this.maximize();
        */
    }
    async _onRemovePolymorpher(event) {
        Dialog.confirm({
            title: i18n('AP.dialogs.polymorpherManager.confirm.title'),
            content: i18n('AP.dialogs.polymorpherManager.confirm.content'),
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
        const actorId = event.currentTarget.parentElement.dataset.aid;
        const actor = getGame().actors?.get(actorId);
        if (actor) {
            actor.sheet?.render(true);
        }
    }
    async loadPolymorphers() {
        const data = this.actor &&
            (this.actor.getFlag(APCONSTS.MN, 'isLocal') || getGame().settings.get(APCONSTS.MN, 'storeonactor'))
            ? this.actor.getFlag(APCONSTS.MN, 'polymorphers') || []
            : getGame().user?.getFlag(APCONSTS.MN, 'polymorphers');
        if (data) {
            for (const polymorpher of data) {
                this.element.find('#polymorpher-list').append(this.generateLi(polymorpher));
            }
        }
    }
    generateLi(data) {
        const actor = getGame().actors?.get(data.id) || getGame().actors?.getName(data.id);
        if (!actor)
            return '';
        const restricted = getGame().settings.get(APCONSTS.MN, 'restrictOwned');
        if (restricted && !actor.isOwner)
            return '';
        const $li = $(`
	<li id="polymorpher" class="polymorpher-item" data-aid="${actor.id}" data-elid="${randomID()}" draggable="true">
		<div class="summon-btn">
			<img class="actor-image" src="${actor.data.img}" alt="">
			<div class="warpgate-btn" id="summon-polymorpher" data-aid="${actor.id}"></div>
		</div>
    	<span class="actor-name">${actor.data.name}</span>
		<div class="polymorpher-number"><input type="number" min="1" max="99" class="fancy-input" step="1" id="polymorpher-number-val" value="${data.number || 1}"></div>
    	<select class="anim-dropdown">
        	${this.getAnimations(data.animation)}
    	</select>
		<i id="remove-polymorpher" class="fas fa-trash"></i>
	</li>
	`);
        //    <i id="advanced-params" class="fas fa-edit"></i>
        return $li;
    }
    getAnimations(anim) {
        let animList = '';
        for (const [group, animations] of Object.entries(APCONSTS.animations)) {
            const localGroup = i18n(`AP.groups.${group}`);
            animList += `<optgroup label="${localGroup == `AP.groups.${group}` ? group : localGroup}">`;
            for (const a of animations) {
                animList += `<option value="${a.key}" ${a.key == anim ? 'selected' : ''}>${a.name}</option>`;
            }
            animList += '</optgroup>';
        }
        return animList;
    }
    async wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async saveData() {
        const data = [];
        for (const polymorpher of this.element.find('.polymorpher-item')) {
            data.push({
                id: polymorpher.dataset.aid,
                animation: $(polymorpher).find('.anim-dropdown').val(),
                number: $(polymorpher).find('#polymorpher-number-val').val(),
            });
        }
        this.actor && (this.actor.getFlag(APCONSTS.MN, 'isLocal') || getGame().settings.get(APCONSTS.MN, 'storeonactor'))
            ? this.actor.setFlag(APCONSTS.MN, 'polymorphers', data)
            : getGame().user?.setFlag(APCONSTS.MN, 'polymorphers', data);
    }
    //@ts-ignore
    close(noSave = false) {
        if (!noSave)
            this.saveData();
        super.close();
    }
    _updateObject(event) {
        // DO NOTHING
    }
}
export class SimplePolymorpherManager extends PolymorpherManager {
    constructor(summonData, spellLevel, actor) {
        super({});
        this.caster = actor;
        this.summons = summonData;
        this.spellLevel = spellLevel;
    }
    async activateListeners(html) {
        for (const summon of this.summons) {
            this.element.find('#polymorpher-list').append(this.generateLi(summon));
        }
        html.on('click', '#summon-polymorpher', this._onSummonPolymorpher.bind(this));
        html.on('click', '.actor-name', this._onOpenSheet.bind(this));
    }
    _onDrop(event) {
        // DO NOTHING
    }
    close() {
        super.close(true);
    }
}
