import { Creature, SystemCreatures } from './automatedPolymorpherModels';
import { warn, error, debug, i18n, i18nFormat, log } from '../automated-polymorpher';
import { PolymorpherManager, SimplePolymorpherManager } from './polymorphermanager';
import { AUTOMATED_POLYMORPHER_MODULE_NAME, getCanvas, getGame } from './settings';
import { ANIMATIONS } from './animations';

// let automatedpolymorphers: SystemCreatures;

export const readyHooks = async () => {
  // setup all the hooks

  ANIMATIONS.animationFunctions = mergeObject(
    ANIMATIONS.animationFunctions,
    <any>getGame().settings?.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'customanimations'),
  );
  log('Automated Evocations: Animation Functions Loaded - ', ANIMATIONS.animationFunctions);
  const sortedAnims = Object.keys(ANIMATIONS.animationFunctions).sort();
  for (const k of sortedAnims) {
    const group = ANIMATIONS.animationFunctions[k].group || 'z-none';
    ANIMATIONS.animations[group] = ANIMATIONS.animations[group] || [];
    ANIMATIONS.animations[group].push({
      name: ANIMATIONS.animationFunctions[k]?.name || i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.animations.${k}`),
      key: k,
    });
  }
  ANIMATIONS.animations = Object.keys(ANIMATIONS.animations)
    .sort()
    .reduce((obj, key) => {
      obj[key] = ANIMATIONS.animations[key];
      return obj;
    }, {});
  //new PolymorpherManager().render(true)
  /*
  if (!automatedpolymorphers) {
    automatedpolymorphers = {};
  }
  if (getGame().system.id == 'dnd5e') {
    automatedpolymorphers['dnd5e'] = {
      // TODO PREPARE SOME PRESET
    };
  }

  automatedpolymorphers[getGame().system.id] = mergeObject(
    automatedpolymorphers[getGame().system.id],
    <any>getGame().settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'customautospells'),
  );
  */
  Hooks.on('getActorSheetHeaderButtons', (app, buttons) => {
    if (getGame().settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'hidebutton')) return;

    const removeLabelSheetHeader = getGame().settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'removeLabelSheetHeader');
    const restrictedOnlyGM = getGame().settings.get(AUTOMATED_POLYMORPHER_MODULE_NAME, 'restrictOnlyGM');
    if (restrictedOnlyGM && !getGame().user?.isGM) {
      return;
    }

    buttons.unshift({
      icon: 'fas fa-wind',
      class: 'open-pm',
      label: removeLabelSheetHeader ? '' : i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.actorSheetBtn`),
      onclick: function openPM(event) {
        const actor = app.object;
        new PolymorpherManager(actor).render(true);
      },
    });
  });
  /*
  Hooks.on("createChatMessage", async (chatMessage) => {
    if(game.system.id != "dnd5e")return;
    if (chatMessage.data.user !== game.user.id || !game.settings.get(AECONSTS.MN, "enableautomations")) return;
    let spellName =
      chatMessage.data.flavor ||
      canvas.tokens.get(chatMessage?.data?.speaker?.token)?.actor?.items?.get(chatMessage?.data?.flags?.dnd5e?.roll?.itemId)?.data?.name;
    let system = game.automatedevocations[game.system.id];
    if (!system) return;
    if (system[spellName]) {
      //attempt to get spell level
      let spellLevel;
      const midiLevel = typeof MidiQOL !== "undefined" && chatMessage.data.flags["midi-qol"] ? MidiQOL.Workflow.getWorkflow(chatMessage.data.flags["midi-qol"].workflowId)?.itemLevel : undefined;
      const brLevel = chatMessage.data.flags?.betterrolls5e?.params?.slotLevel
      const coreLevel = $(chatMessage.data.content)?.data("spell-level")
      spellLevel = midiLevel || brLevel || coreLevel || 0;
      spellLevel = parseInt(spellLevel);
      let summonData = [];
      const data = {level:spellLevel}
      const creatures = typeof system[spellName] === "function" ? system[spellName](data) : system[spellName];
      for (let creature of creatures) {
        if (creature.level && spellLevel && creature.level >= spellLevel)
          continue;
        let actor = game.actors.getName(creature.creature);
        if (actor) {
          summonData.push({
            id: actor.id,
            number: creature.number,
            animation: creature.animation,
          });
        }
      }
      new SimpleCompanionManager(summonData,spellLevel,canvas.tokens.get(chatMessage?.data?.speaker?.token)?.actor).render(true);
    }
  });

  Hooks.on("createChatMessage", async (chatMessage) => {
    if(game.system.id != "pf2e")return;
    if (chatMessage.data.user !== game.user.id || !game.settings.get(AECONSTS.MN, "enableautomations")) return;
    const item = await fromUuid(chatMessage.data.flags.pf2e.origin.uuid)
    const spellName = item.data.name;
    let system = game.automatedevocations[game.system.id];
    if (!system) return;
    if (system[spellName]) {
      let summonData = [];
      const spellLevel = $(chatMessage.data.content)?.data("spell-lvl")
      const data = {level:item, spellLevel:spellLevel}
    //const data = {level:item}
      const creatures = typeof system[spellName] === "function" ? system[spellName](data) : system[spellName];
      for (let creature of creatures) {
        if (creature.level && spellLevel && creature.level >= spellLevel)
          continue;
        let actor = game.actors.getName(creature.creature);
        if (actor) {
          summonData.push({
            id: actor.id,
            number: creature.number,
            animation: creature.animation,
          });
        }
      }
      new SimpleCompanionManager(summonData,spellLevel,canvas.tokens.get(chatMessage?.data?.speaker?.token)?.actor).render(true);
    }
  });
  */
};

export const setupHooks = () => {
  // DO NOTHING
};

export const initHooks = () => {
  warn('Init Hooks processing');
};
