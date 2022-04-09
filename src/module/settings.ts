import CONSTANTS from './constants';
import { i18n } from './lib/lib';

export const registerSettings = function () {
  game.settings.register(CONSTANTS.MODULE_NAME, 'polymorphers', {
    name: '',
    hint: '',
    scope: 'client',
    config: false,
    type: Array,
    default: [],
  });
  // game.settings.register(CONSTANTS.MODULE_NAME, 'customautospells', {
  //   name: '',
  //   hint: '',
  //   scope: 'world',
  //   config: false,
  //   type: Object,
  //   default: {},
  // });
  game.settings.register(CONSTANTS.MODULE_NAME, 'customanimations', {
    name: '',
    hint: '',
    scope: 'world',
    config: false,
    type: Object,
    default: {},
  });
  game.settings.register(CONSTANTS.MODULE_NAME, 'autoclose', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.autoclose.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.autoclose.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  game.settings.register(CONSTANTS.MODULE_NAME, 'enableautomations', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.enableautomations.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.enableautomations.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(CONSTANTS.MODULE_NAME, 'storeonactor', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.storeonactor.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.storeonactor.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(CONSTANTS.MODULE_NAME, 'hidebutton', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hidebutton.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hidebutton.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  game.settings.register(CONSTANTS.MODULE_NAME, 'restrictOwned', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOwned.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOwned.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  game.settings.register(CONSTANTS.MODULE_NAME, 'restrictOnlyGM', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOnlyGM.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOnlyGM.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
  game.settings.register(CONSTANTS.MODULE_NAME, 'removeLabelSheetHeader', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.removeLabelSheetHeader.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.removeLabelSheetHeader.hint`),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(CONSTANTS.MODULE_NAME, 'hudEnable', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudEnable.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudEnable.hint`),
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
  });

  /** Which column should the button be placed on */
  game.settings.register(CONSTANTS.MODULE_NAME, 'hudColumn', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColumn.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColumn.hint`),
    scope: 'client',
    config: true,
    type: String,
    default: 'Left',
    choices: <any>{
      Left: 'Left',
      Right: 'Right',
    },
  });

  /** Whether the button should be placed on the top or bottom of the column */
  game.settings.register(CONSTANTS.MODULE_NAME, 'hudTopBottom', {
    name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudTopBottom.title`),
    hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudTopBottom.hint`),
    scope: 'client',
    config: true,
    type: String,
    default: 'Top',
    choices: <any>{
      Top: 'Top',
      Bottom: 'Bottom',
    },
  });
};
