import { i18n } from '../automated-polymorpher';
import { APCONSTS } from './config';
// import ImagePicker from "./libs/ImagePicker";
// import SoundPicker from "./libs/SoundPicker";

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
export function getCanvas(): Canvas {
  if (!(canvas instanceof Canvas) || !canvas.ready) {
    throw new Error('Canvas Is Not Initialized');
  }
  return canvas;
}

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
export function getGame(): Game {
  if (!(game instanceof Game)) {
    throw new Error('Game Is Not Initialized');
  }
  return game;
}

export const registerSettings = function () {
  getGame().settings.register(APCONSTS.MN, 'polymorphers', {
    name: '',
    hint: '',
    scope: 'client',
    config: false,
    type: Array,
    default: [],
  });
  // getGame().settings.register(APCONSTS.MN, 'customautospells', {
  //   name: '',
  //   hint: '',
  //   scope: 'world',
  //   config: false,
  //   type: Object,
  //   default: {},
  // });
  getGame().settings.register(APCONSTS.MN, 'customanimations', {
    name: '',
    hint: '',
    scope: 'world',
    config: false,
    type: Object,
    default: {},
  });
  getGame().settings.register(APCONSTS.MN, 'autoclose', {
    name: i18n(`AP.settings.autoclose.title`),
    hint: i18n(`AP.settings.autoclose.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  getGame().settings.register(APCONSTS.MN, 'enableautomations', {
    name: i18n(`AP.settings.enableautomations.title`),
    hint: i18n(`AP.settings.enableautomations.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  getGame().settings.register(APCONSTS.MN, 'storeonactor', {
    name: i18n(`AP.settings.storeonactor.title`),
    hint: i18n(`AP.settings.storeonactor.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  getGame().settings.register(APCONSTS.MN, 'hidebutton', {
    name: i18n(`AP.settings.hidebutton.title`),
    hint: i18n(`AP.settings.hidebutton.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  getGame().settings.register(APCONSTS.MN, 'restrictOwned', {
    name: i18n(`AP.settings.restrictOwned.title`),
    hint: i18n(`AP.settings.restrictOwned.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
};
