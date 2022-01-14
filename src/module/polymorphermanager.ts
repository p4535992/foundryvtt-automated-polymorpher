import { TokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { i18n } from '../automated-polymorpher';
import { ANIMATIONS } from './animations';
import { PolymorpherData, PolymorpherFlags } from './automatedPolymorpherModels';
import { AUTOMATED_POLYMORPHER_MODULE_NAME } from './settings';
import { canvas, game } from './settings';

export class PolymorpherManager extends FormApplication {
  // caster: Actor;
  summons: any[] | undefined;
  // spellLevel: number | undefined;
  actor: Actor;

  constructor(actor: Actor, summonData?: any[]) {
    super({});
    // this.caster = actor;
    this.summons = summonData;
    // this.spellLevel = spellLevel;
    this.actor = actor;
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      title: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.dialogs.polymorpherManager.title`),
      id: 'polymorpherManager',
      template: `modules/${AUTOMATED_POLYMORPHER_MODULE_NAME}/templates/polymorphermanager.hbs`,
      resizable: true,
      width: 300,
      height: window.innerHeight > 400 ? 400 : window.innerHeight - 100,
      dragDrop: [{ dragSelector: null, dropSelector: null }],
    };
  }

  getData(): any {
    return {};
  }

  async activateListeners(html) {
    html
      .find('#polymorpher-list')
      .before(
        `<div class="searchbox"><input type="text" class="searchinput" placeholder="Drag and Drop an actor to add it to the list."></div>`,
      );
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
    const search = <string>$(event.currentTarget).val();
    this.element.find('.actor-name').each(function () {
      if ($(this).text().toLowerCase().includes(search.toLowerCase())) {
        $(this).parent().slideDown(200);
      } else {
        $(this).parent().slideUp(200);
      }
    });
  }

  _onDrop(event) {
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch {
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
    const animation = <string>$(event.currentTarget.parentElement.parentElement).find('.anim-dropdown').val();
    const aId = event.currentTarget.dataset.aid;
    const actor = <Actor>game.actors?.get(aId);
    // const duplicates = <number>$(event.currentTarget.parentElement.parentElement).find('#polymorpher-number-val').val();
    const tokenData = <TokenData>await actor.getTokenData();
    const posData = <Token>canvas.tokens?.placeables.find((t: Token) => t.id === this.actor?.token?.id) || undefined;
    // Get the target actor
    const sourceActor = actor;
    // if (data.pack) {
    //   const pack = game.packs.find(p => p.collection === data.pack);
    //   sourceActor = await pack.getEntity(data.id);
    // } else {
    //   sourceActor = game.actors.get(data.id);
    // }
    if (!sourceActor) return;

    if (game.system.id == 'dnd5e') {
      const canPolymorph = game.user?.isGM || (this.actor.isOwner && game.settings.get('dnd5e', 'allowPolymorphing'));
      if (!canPolymorph) return false;

      // Define a function to record polymorph settings for future use
      const rememberOptions = (html) => {
        const options = {};
        html.find('input').each((i, el) => {
          options[el.name] = el.checked;
        });
        const settings = mergeObject(<any>game.settings.get('dnd5e', 'polymorphSettings') || {}, options);
        game.settings.set('dnd5e', 'polymorphSettings', settings);
        return settings;
      };

      // Create and render the Dialog
      return new Dialog(
        {
          title: i18n('DND5E.PolymorphPromptTitle'),
          //@ts-ignore
          content: {
            options: game.settings.get('dnd5e', 'polymorphSettings'),
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
                if (posData) {
                  if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                    //@ts-ignore
                    game.macros?.getName(ANIMATIONS.animationFunctions[animation].fn)?.execute(posData, tokenData);
                  } else {
                    ANIMATIONS.animationFunctions[animation].fn(posData, tokenData);
                  }
                  await this.wait(ANIMATIONS.animationFunctions[animation].time);
                }
                //@ts-ignore
                await this.actor.transformInto(
                  // await this._transformIntoCustom(
                  sourceActor,
                  rememberOptions(html),
                );
                if (game.settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'autoclose')) {
                  this.close();
                } else {
                  this.maximize();
                }
              },
            },
            wildshape: {
              icon: '<i class="fas fa-paw"></i>',
              label: i18n('DND5E.PolymorphWildShape'),
              callback: async (html) => {
                if (posData) {
                  if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                    //@ts-ignore
                    game.macros?.getName(ANIMATIONS.animationFunctions[animation].fn)?.execute(posData, tokenData);
                  } else {
                    ANIMATIONS.animationFunctions[animation].fn(posData, tokenData);
                  }
                  await this.wait(ANIMATIONS.animationFunctions[animation].time);
                }
                //@ts-ignore
                await this.actor.transformInto(
                  // await this._transformIntoCustom(
                  sourceActor,
                  {
                    keepBio: true,
                    keepClass: true,
                    keepMental: true,
                    mergeSaves: true,
                    mergeSkills: true,
                    transformTokens: rememberOptions(html).transformTokens,
                  },
                );
                if (game.settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'autoclose')) {
                  this.close();
                } else {
                  this.maximize();
                }
              },
            },
            polymorph: {
              icon: '<i class="fas fa-pastafarianism"></i>',
              label: i18n('DND5E.Polymorph'),
              callback: async (html) => {
                if (posData) {
                  if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
                    //@ts-ignore
                    game.macros?.getName(ANIMATIONS.animationFunctions[animation].fn)?.execute(posData, tokenData);
                  } else {
                    ANIMATIONS.animationFunctions[animation].fn(posData, tokenData);
                  }
                  await this.wait(ANIMATIONS.animationFunctions[animation].time);
                }
                //@ts-ignore
                await this.actor.transformInto(
                  // await this._transformIntoCustom(
                  sourceActor,
                  {
                    transformTokens: rememberOptions(html).transformTokens,
                  },
                );

                if (game.settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'autoclose')) {
                  this.close();
                } else {
                  this.maximize();
                }
              },
            },
            cancel: {
              icon: '<i class="fas fa-times"></i>',
              label: i18n('Cancel'),
            },
          },
        },
        {
          classes: ['dialog', 'dnd5e'],
          width: 600,
          template: 'systems/dnd5e/templates/apps/polymorph-prompt.html',
        },
      ).render(true);
    } else {
      // ===========================================
      // If system is not dnd5e we can use warpgate
      // ===========================================
      if (typeof ANIMATIONS.animationFunctions[animation].fn == 'string') {
        //@ts-ignore
        game.macros?.getName(ANIMATIONS.animationFunctions[animation].fn)?.execute(posData, tokenData);
      } else {
        ANIMATIONS.animationFunctions[animation].fn(posData, tokenData);
      }
      await this.wait(ANIMATIONS.animationFunctions[animation].time);

      //get custom data macro
      const customTokenData = await game.macros?.getName(`AP_Polymorpher_Macro(${actor.data.name})`)?.execute({
        //@ts-ignore
        polymorpherActor: actor,
        // spellLevel: this.spellLevel || 0,
        // duplicates: duplicates,
        assignedActor: this.actor || game.user?.character || _token?.actor,
      });

      // log("Automated Polymorpher", {
      //   assignedActor: this.caster || game.user?.character || _token?.actor,
      //   spellLevel: this.spellLevel || 0,
      //   duplicates: duplicates,
      //   warpgateData: customTokenData || {},
      //   summon: actor,
      //  tokenData: tokenData,
      //  posData: posData,
      // })
      //@ts-ignore
      warpgate.mutate(posData.document, customTokenData || {}, {}, {});

      if (game.settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'autoclose')) this.close();
      else this.maximize();
    }
  }

  async _onRemovePolymorpher(event) {
    Dialog.confirm({
      title: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.dialogs.polymorpherManager.confirm.title`),
      content: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.dialogs.polymorpherManager.confirm.content`),
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
    const actor = game.actors?.get(actorId);
    if (actor) {
      actor.sheet?.render(true);
    }
  }

  async loadPolymorphers() {
    const data: any =
      this.actor &&
      (<boolean>this.actor.getFlag(AUTOMATED_POLYMORPHER_MODULE_NAME, PolymorpherFlags.IS_LOCAL) ||
        game.settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR))
        ? this.actor.getFlag(AUTOMATED_POLYMORPHER_MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || []
        : game.user?.getFlag(AUTOMATED_POLYMORPHER_MODULE_NAME, PolymorpherFlags.POLYMORPHERS);
    if (data) {
      for (const polymorpher of data) {
        this.element.find('#polymorpher-list').append(this.generateLi(polymorpher));
      }
    }
  }

  generateLi(data) {
    const actor = game.actors?.get(data.id) || game.actors?.getName(data.id);
    if (!actor) return '';
    const restricted = game.settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'restrictOwned');
    if (restricted && !actor.isOwner) return '';
    const $li = $(`
	<li id="polymorpher" class="polymorpher-item" data-aid="${actor.id}" data-elid="${randomID()}" draggable="true">
		<div class="summon-btn">
			<img class="actor-image" src="${actor.data.img}" alt="">
			<div class="warpgate-btn" id="summon-polymorpher" data-aid="${actor.id}"></div>
		</div>
    	<span class="actor-name">${actor.data.name}</span>
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
    for (const [group, animations] of Object.entries(ANIMATIONS.animations)) {
      const localGroup = i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.groups.${group}`);
      animList += `<optgroup label="${
        localGroup == `${AUTOMATED_POLYMORPHER_MODULE_NAME}.groups.${group}` ? group : localGroup
      }">`;
      for (const a of <any[]>animations) {
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
    const data: PolymorpherData[] = [];
    for (const polymorpher of this.element.find('.polymorpher-item')) {
      data.push({
        id: <string>polymorpher.dataset.aid,
        animation: <string>$(polymorpher).find('.anim-dropdown').val(),
        number: <number>$(polymorpher).find('#polymorpher-number-val').val(),
      });
    }
    this.actor &&
    (this.actor.getFlag(AUTOMATED_POLYMORPHER_MODULE_NAME, PolymorpherFlags.IS_LOCAL) ||
      game.settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR))
      ? this.actor.setFlag(AUTOMATED_POLYMORPHER_MODULE_NAME, PolymorpherFlags.POLYMORPHERS, data)
      : game.user?.setFlag(AUTOMATED_POLYMORPHER_MODULE_NAME, PolymorpherFlags.POLYMORPHERS, data);
  }

  //@ts-ignore
  close(noSave = false) {
    if (!noSave) this.saveData();
    super.close();
  }

  _updateObject(event): any {
    // DO NOTHING
  }
}

export class SimplePolymorpherManager extends PolymorpherManager {
  // caster: Actor;
  // summons: any[];
  // spellLevel: number;

  constructor(actor, summonData) {
    super(actor, summonData);
    // this.caster = actor;
    // this.summons = summonData;
    // this.spellLevel = spellLevel;
  }

  async activateListeners(html) {
    for (const summon of <any[]>this.summons) {
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
