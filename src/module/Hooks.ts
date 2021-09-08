import { warn, error, debug, i18n, i18nFormat, log } from '../automated-polymorpher';
import { APCONSTS } from './main';
import { PolymorpherManager } from './polymorphermanager';
import { getGame } from './settings';

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
};

export const setupHooks = () => {
  //
};

export const initHooks = () => {
  warn('Init Hooks processing');

};
