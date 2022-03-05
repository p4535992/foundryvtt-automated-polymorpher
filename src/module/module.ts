import { Creature, SystemCreatures } from './automatedPolymorpherModels';
import { warn, error, debug, i18n, i18nFormat, log } from './lib/lib';
import { PolymorpherManager, SimplePolymorpherManager } from './polymorphermanager';
import { ANIMATIONS } from './animations';
import { canvas, game } from './settings';
import CONSTANTS from './constants';

export const initHooks = () => {
  warn('Init Hooks processing');
};

export const setupHooks = () => {
  // DO NOTHING
};

export const readyHooks = async () => {
  // setup all the hooks

  ANIMATIONS.animationFunctions = mergeObject(
    ANIMATIONS.animationFunctions,
    <any>game.settings?.get(CONSTANTS.MODULE_NAME, 'customanimations'),
  );
  log('Automated Evocations: Animation Functions Loaded - ' + ANIMATIONS.animationFunctions);
  const sortedAnims = Object.keys(ANIMATIONS.animationFunctions).sort();
  for (const k of sortedAnims) {
    const group = ANIMATIONS.animationFunctions[k].group || 'z-none';
    ANIMATIONS.animations[group] = ANIMATIONS.animations[group] || [];
    ANIMATIONS.animations[group].push({
      name: ANIMATIONS.animationFunctions[k]?.name || i18n(`${CONSTANTS.MODULE_NAME}.animations.${k}`),
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
  if (game.system.id == 'dnd5e') {
    automatedpolymorphers['dnd5e'] = {
      // TODO PREPARE SOME PRESET
    };
  }

  automatedpolymorphers[game.system.id] = mergeObject(
    automatedpolymorphers[game.system.id],
    <any>game.settings.get(CONSTANTS.MODULE_NAME, 'customautospells'),
  );
  */
  Hooks.on('getActorSheetHeaderButtons', (app, buttons) => {
    if (game.settings.get(CONSTANTS.MODULE_NAME, 'hidebutton')) return;

    const removeLabelSheetHeader = game.settings.get(CONSTANTS.MODULE_NAME, 'removeLabelSheetHeader');
    const restrictedOnlyGM = game.settings.get(CONSTANTS.MODULE_NAME, 'restrictOnlyGM');
    if (restrictedOnlyGM && !game.user?.isGM) {
      return;
    }

    buttons.unshift({
      icon: 'fas fa-wind',
      class: 'open-pm',
      label: removeLabelSheetHeader ? '' : i18n(`${CONSTANTS.MODULE_NAME}.actorSheetBtn`),
      onclick: function openPM(event) {
        const actor = app.object;
        new PolymorpherManager(actor).render(true);
      },
    });
  });
};
