import { i18n } from '../automated-polymorpher';

export const AUTOMATED_POLYMORPHER_MODULE_NAME = 'automated-polymorpher';

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
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'polymorphers', {
    name: '',
    hint: '',
    scope: 'client',
    config: false,
    type: Array,
    default: [],
  });
  // getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'customautospells', {
  //   name: '',
  //   hint: '',
  //   scope: 'world',
  //   config: false,
  //   type: Object,
  //   default: {},
  // });
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'customanimations', {
    name: '',
    hint: '',
    scope: 'world',
    config: false,
    type: Object,
    default: {},
  });
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'autoclose', {
    name: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.autoclose.title`),
    hint: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.autoclose.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'enableautomations', {
    name: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.enableautomations.title`),
    hint: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.enableautomations.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'storeonactor', {
    name: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.storeonactor.title`),
    hint: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.storeonactor.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'hidebutton', {
    name: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.hidebutton.title`),
    hint: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.hidebutton.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'restrictOwned', {
    name: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.restrictOwned.title`),
    hint: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.restrictOwned.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'restrictOnlyGM', {
    name: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.restrictOnlyGM.title`),
    hint: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.settings.restrictOnlyGM.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  getGame().settings.register(AUTOMATED_POLYMORPHER_MODULE_NAME, 'removeLabelSheetHeader', {
    name: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.removeLabelSheetHeader.title`),
    hint: i18n(`${AUTOMATED_POLYMORPHER_MODULE_NAME}.removeLabelSheetHeader.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
};
