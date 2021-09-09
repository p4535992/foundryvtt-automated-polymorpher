import { TokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { i18n } from '../automated-polymorpher';
import { APCONSTS } from './config';
import { getCanvas, getGame } from './settings';

export class PolymorpherManager extends FormApplication {
  actor: Actor;

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
    const actor = <Actor>getGame().actors?.get(aId);
    const duplicates = <number>$(event.currentTarget.parentElement.parentElement).find('#polymorpher-number-val').val();
    const tokenData = <TokenData>await actor.getTokenData();
    const posData = <Token>actor.token?.object;

    const canPolymorph =
      getGame().user?.isGM || (this.actor.isOwner && getGame().settings.get('dnd5e', 'allowPolymorphing'));
    if (!canPolymorph) return false;

    // Get the target actor
    const sourceActor = actor;
    // if (data.pack) {
    //   const pack = getGame().packs.find(p => p.collection === data.pack);
    //   sourceActor = await pack.getEntity(data.id);
    // } else {
    //   sourceActor = getGame().actors.get(data.id);
    // }
    if (!sourceActor) return;

    // Define a function to record polymorph settings for future use
    const rememberOptions = (html) => {
      const options = {};
      html.find('input').each((i, el) => {
        options[el.name] = el.checked;
      });
      const settings = mergeObject(<any>getGame().settings.get('dnd5e', 'polymorphSettings') || {}, options);
      getGame().settings.set('dnd5e', 'polymorphSettings', settings);
      return settings;
    };

    // Create and render the Dialog
    return new Dialog(
      {
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
              if (typeof APCONSTS.animationFunctions[animation].fn == 'string') {
                //@ts-ignore
                getGame().macros?.getName(APCONSTS.animationFunctions[animation].fn)?.execute(posData, tokenData);
              } else {
                APCONSTS.animationFunctions[animation].fn(posData, tokenData);
              }
              await this.wait(APCONSTS.animationFunctions[animation].time);

              //@ts-ignore
              await this.actor.transformInto(
                // await this._transformIntoCustom(
                sourceActor,
                rememberOptions(html),
              );
              if (getGame().settings.get(APCONSTS.MN, 'autoclose')) this.close();
              else this.maximize();
            },
          },
          wildshape: {
            icon: '<i class="fas fa-paw"></i>',
            label: i18n('DND5E.PolymorphWildShape'),
            callback: async (html) => {
              if (typeof APCONSTS.animationFunctions[animation].fn == 'string') {
                //@ts-ignore
                getGame().macros?.getName(APCONSTS.animationFunctions[animation].fn)?.execute(posData, tokenData);
              } else {
                APCONSTS.animationFunctions[animation].fn(posData, tokenData);
              }
              await this.wait(APCONSTS.animationFunctions[animation].time);

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
              if (getGame().settings.get(APCONSTS.MN, 'autoclose')) this.close();
              else this.maximize();
            },
          },
          polymorph: {
            icon: '<i class="fas fa-pastafarianism"></i>',
            label: i18n('DND5E.Polymorph'),
            callback: async (html) => {
              if (typeof APCONSTS.animationFunctions[animation].fn == 'string') {
                //@ts-ignore
                getGame().macros?.getName(APCONSTS.animationFunctions[animation].fn)?.execute(posData, tokenData);
              } else {
                APCONSTS.animationFunctions[animation].fn(posData, tokenData);
              }
              await this.wait(APCONSTS.animationFunctions[animation].time);

              //@ts-ignore
              await this.actor.transformInto(
                // await this._transformIntoCustom(
                sourceActor,
                {
                  transformTokens: rememberOptions(html).transformTokens,
                },
              );

              if (getGame().settings.get(APCONSTS.MN, 'autoclose')) this.close();
              else this.maximize();
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
    const data: any =
      this.actor &&
      (<boolean>this.actor.getFlag(APCONSTS.MN, 'isLocal') || getGame().settings.get(APCONSTS.MN, 'storeonactor'))
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
    if (!actor) return '';
    const restricted = getGame().settings.get(APCONSTS.MN, 'restrictOwned');
    if (restricted && !actor.isOwner) return '';
    const $li = $(`
	<li id="polymorpher" class="polymorpher-item" data-aid="${actor.id}" data-elid="${randomID()}" draggable="true">
		<div class="summon-btn">
			<img class="actor-image" src="${actor.data.img}" alt="">
			<div class="warpgate-btn" id="summon-polymorpher" data-aid="${actor.id}"></div>
		</div>
    	<span class="actor-name">${actor.data.name}</span>
		<div class="polymorpher-number" style="display:none"><input type="number" min="1" max="99" class="fancy-input" step="1" id="polymorpher-number-val" value="${
      data.number || 1
    }"></div>
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
    const data: any[] = [];
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
    if (!noSave) this.saveData();
    super.close();
  }

  _updateObject(event): any {
    // DO NOTHING
  }

  // /**
  //  * Transform this Actor into another one.
  //  *
  //  * @param {Actor5e} target            The target Actor.
  //  * @param {boolean} [keepPhysical]    Keep physical abilities (str, dex, con)
  //  * @param {boolean} [keepMental]      Keep mental abilities (int, wis, cha)
  //  * @param {boolean} [keepSaves]       Keep saving throw proficiencies
  //  * @param {boolean} [keepSkills]      Keep skill proficiencies
  //  * @param {boolean} [mergeSaves]      Take the maximum of the save proficiencies
  //  * @param {boolean} [mergeSkills]     Take the maximum of the skill proficiencies
  //  * @param {boolean} [keepClass]       Keep proficiency bonus
  //  * @param {boolean} [keepFeats]       Keep features
  //  * @param {boolean} [keepSpells]      Keep spells
  //  * @param {boolean} [keepItems]       Keep items
  //  * @param {boolean} [keepBio]         Keep biography
  //  * @param {boolean} [keepVision]      Keep vision
  //  * @param {boolean} [transformTokens] Transform linked tokens too
  //  */
  // async _transformIntoCustom(target, { keepPhysical=false, keepMental=false, keepSaves=false, keepSkills=false,
  //   mergeSaves=false, mergeSkills=false, keepClass=false, keepFeats=false, keepSpells=false,
  //   keepItems=false, keepBio=false, keepVision=false, transformTokens=true}={}) {

  //   // Ensure the player is allowed to polymorph
  //   const allowed = getGame().settings.get("dnd5e", "allowPolymorphing");
  //   if ( !allowed && !getGame().user?.isGM ) {
  //     return ui.notifications?.warn(getGame().i18n.localize("DND5E.PolymorphWarn"));
  //   }

  //   // Get the original Actor data and the new source data
  //   const o:any = this.actor.toJSON();
  //   o.flags.dnd5e = o.flags.dnd5e || {};
  //   o.flags.dnd5e.transformOptions = {mergeSkills, mergeSaves};
  //   const source = target.toJSON();

  //   // Prepare new data to merge from the source
  //   const d:any = {
  //     type: o.type, // Remain the same actor type
  //     name: `${o.name} (${source.name})`, // Append the new shape to your old name
  //     data: source.data, // Get the data model of your new form
  //     items: source.items, // Get the items of your new form
  //     effects: o.effects.concat(source.effects), // Combine active effects from both forms
  //     img: source.img, // New appearance
  //     permission: o.permission, // Use the original actor permissions
  //     folder: o.folder, // Be displayed in the same sidebar folder
  //     flags: o.flags // Use the original actor flags
  //   };

  //   // Specifically delete some data attributes
  //   delete d.data.resources; // Don't change your resource pools
  //   delete d.data.currency; // Don't lose currency
  //   delete d.data.bonuses; // Don't lose global bonuses

  //   // Specific additional adjustments
  //   d.data.details.alignment = o.data.details.alignment; // Don't change alignment
  //   d.data.attributes.exhaustion = o.data.attributes.exhaustion; // Keep your prior exhaustion level
  //   d.data.attributes.inspiration = o.data.attributes.inspiration; // Keep inspiration
  //   d.data.spells = o.data.spells; // Keep spell slots
  //   d.data.attributes.ac.flat = target.data.data.attributes.ac.value; // Override AC

  //   // Token appearance updates
  //   d.token = {name: d.name};
  //   for ( let k of ["width", "height", "scale", "img", "mirrorX", "mirrorY", "tint", "alpha", "lockRotation"] ) {
  //     d.token[k] = source.token[k];
  //   }
  //   const vision = keepVision ? o.token : source.token;
  //   for ( let k of ['dimSight', 'brightSight', 'dimLight', 'brightLight', 'vision', 'sightAngle'] ) {
  //     d.token[k] = vision[k];
  //   }
  //   if ( source.token.randomImg ) {
  //     const images = await target.getTokenImages();
  //     d.token.img = images[Math.floor(Math.random() * images.length)];
  //   }

  //   // Transfer ability scores
  //   const abilities:any = d.data.abilities;
  //   for ( let k of Object.keys(abilities) ) {
  //     const oa = o.data.abilities[k];
  //     const prof = abilities[k].proficient;
  //     if ( keepPhysical && ["str", "dex", "con"].includes(k) ) abilities[k] = oa;
  //     else if ( keepMental && ["int", "wis", "cha"].includes(k) ) abilities[k] = oa;
  //     if ( keepSaves ) abilities[k].proficient = oa.proficient;
  //     else if ( mergeSaves ) abilities[k].proficient = Math.max(prof, oa.proficient);
  //   }

  //   // Transfer skills
  //   if ( keepSkills ) d.data.skills = o.data.skills;
  //   else if ( mergeSkills ) {
  //     for ( let [k, s] of Object.entries(d.data.skills) ) {
  //       //@ts-ignore
  //       s.value = Math.max(s.value, o.data.skills[k].value);
  //     }
  //   }

  //   // Keep specific items from the original data
  //   d.items = d.items.concat(o.items.filter(i => {
  //     if ( i.type === "class" ) return keepClass;
  //     else if ( i.type === "feat" ) return keepFeats;
  //     else if ( i.type === "spell" ) return keepSpells;
  //     else return keepItems;
  //   }));

  //   // Transfer classes for NPCs
  //   if (!keepClass && d.data.details.cr) {
  //     d.items.push({
  //       type: 'class',
  //       name: getGame().i18n.localize('DND5E.PolymorphTmpClass'),
  //       data: { levels: d.data.details.cr }
  //     });
  //   }

  //   // Keep biography
  //   if (keepBio) d.data.details.biography = o.data.details.biography;

  //   // Keep senses
  //   if (keepVision) d.data.traits.senses = o.data.traits.senses;

  //   // Set new data flags
  //   //@ts-ignore
  //   if ( !this.actor.isPolymorphed || !d.flags.dnd5e.originalActor ) d.flags.dnd5e.originalActor = this.actorid;
  //   d.flags.dnd5e.isPolymorphed = true;

  //   // Update unlinked Tokens in place since they can simply be re-dropped from the base actor
  //   if (this.actor.isToken) {
  //     const tokenData = d.token;
  //     tokenData.actorData = d;
  //     delete tokenData.actorData.token;
  //     return this.actor.token?.update(tokenData);
  //   }

  //   // Update regular Actors by creating a new Actor with the Polymorphed data
  //   await this.actor.sheet?.close();
  //   Hooks.callAll('dnd5e.transformActor', this, target, d, {
  //     keepPhysical, keepMental, keepSaves, keepSkills, mergeSaves, mergeSkills,
  //     keepClass, keepFeats, keepSpells, keepItems, keepBio, keepVision, transformTokens
  //   });

  //   //const newActor = <Actor>await this.actor.constructor.create(d, {renderSheet: true});

  //   // Bug D&D5 not transfer weight and height
  //   const tokenBackup = <Token>duplicate(d.token);
  //   //@ts-ignore
  //   const newActor = <Actor>await this.actor.constructor.create(d, {renderSheet: true});
  //   newActor.data.token?.update({
  //     width: tokenBackup.width,
  //     height: tokenBackup.height,
  //   });

  //   // Update placed Token instances
  //   if ( !transformTokens ) return;
  //   const tokens = this.actor.getActiveTokens(true);
  //   const updates = tokens.map(t => {
  //     const newTokenData = foundry.utils.deepClone(d.token);
  //     newTokenData._id = t.data._id;
  //     newTokenData.actorId = newActor.id;
  //     newTokenData.actorLink = true;
  //     return newTokenData;
  //   });
  //   return getCanvas().scene?.updateEmbeddedDocuments("Token", updates);
  // }
}

export class SimplePolymorpherManager extends PolymorpherManager {
  caster: Actor;
  summons: any[];
  spellLevel: number;

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
