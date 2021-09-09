import { Creature, SystemCreatures } from './automatedPolymorpherModels';
import { warn, error, debug, i18n, i18nFormat, log } from '../automated-polymorpher';
import { APCONSTS } from './config';
import { PolymorpherManager, SimplePolymorpherManager } from './polymorphermanager';
import { getCanvas, getGame } from './settings';

let automatedpolymorphers: SystemCreatures;

export const readyHooks = async () => {
  // setup all the hooks

  APCONSTS.animationFunctions = mergeObject(
    APCONSTS.animationFunctions,
    <any>getGame().settings?.get(APCONSTS.MN, 'customanimations'),
  );
  log('Automated Evocations: Animation Functions Loaded - ', APCONSTS.animationFunctions);
  const sortedAnims = Object.keys(APCONSTS.animationFunctions).sort();
  for (const k of sortedAnims) {
    const group = APCONSTS.animationFunctions[k].group || 'z-none';
    APCONSTS.animations[group] = APCONSTS.animations[group] || [];
    APCONSTS.animations[group].push({
      name: APCONSTS.animationFunctions[k]?.name || i18n(`AP.animations.${k}`),
      key: k,
    });
  }
  APCONSTS.animations = Object.keys(APCONSTS.animations)
    .sort()
    .reduce((obj, key) => {
      obj[key] = APCONSTS.animations[key];
      return obj;
    }, {});
  //new PolymorpherManager().render(true)

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
    <any>getGame().settings.get(APCONSTS.MN, 'customautospells'),
  );

  Hooks.on('getActorSheetHeaderButtons', (app, buttons) => {
    if (getGame().settings.get(APCONSTS.MN, 'hidebutton')) return;
    buttons.unshift({
      icon: 'fas fa-users',
      class: 'open-cm',
      label: i18n('AP.actorSheetBtn'),
      onclick: function openCM(event) {
        const appId = event.currentTarget.offsetParent.dataset.appid;
        //@ts-ignore
        const actor = ui.windows[appId].object;
        new PolymorpherManager(actor).render(true);
      },
    });
  });

  Hooks.on('createChatMessage', async (chatMessage) => {
    if (chatMessage.data.user !== getGame().user?.id || !getGame().settings.get(APCONSTS.MN, 'enableautomations')) {
      return;
    }
    const spellName: string =
      chatMessage.data.flavor ||
      getCanvas()
        .tokens?.get(chatMessage?.data?.speaker?.token)
        ?.actor?.items?.get(chatMessage?.data?.flags?.dnd5e?.roll?.itemId)?.data?.name;
    const system = automatedpolymorphers[getGame().system.id];
    if (!system) {
      return;
    }

    const creaturesCollection = system[spellName];

    if (creaturesCollection) {
      //attempt to get spell level
      let spellLevel;
      //@ts-ignore
      const midiLevel =
        //@ts-ignore
        typeof MidiQOL !== 'undefined' && chatMessage.data.flags['midi-qol']
          ? //@ts-ignore
            MidiQOL.Workflow.getWorkflow(chatMessage.data.flags['midi-qol'].workflowId)?.itemLevel
          : undefined;
      const brLevel = chatMessage.data.flags?.betterrolls5e?.params?.slotLevel;
      const coreLevel = $(chatMessage.data.content)?.data('spell-level');
      spellLevel = midiLevel || brLevel || coreLevel || 0;
      spellLevel = parseInt(spellLevel);
      const summonData: any[] = [];
      const data = { level: spellLevel };
      const creatures: Creature[] =
        typeof creaturesCollection === 'function' ? creaturesCollection(data) : system[spellName];
      for (const creature of creatures) {
        if (creature.level && spellLevel && creature.level >= spellLevel) {
          continue;
        }
        const actor = getGame().actors?.getName(creature.creature);
        if (actor) {
          summonData.push({
            id: actor.id,
            number: creature.number,
            animation: creature.animation,
          });
        }
      }
      new SimplePolymorpherManager(
        summonData,
        spellLevel,
        getCanvas().tokens?.get(chatMessage?.data?.speaker?.token)?.actor,
      ).render(true);
    }
  });
};

export const setupHooks = () => {
  // DO NOTHING
};

export const initHooks = () => {
  warn('Init Hooks processing');
};
