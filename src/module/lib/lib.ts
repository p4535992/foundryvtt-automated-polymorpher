import API from '../api';
import { PolymorpherFlags } from '../automatedPolymorpherModels';
import CONSTANTS from '../constants';
import { PolymorpherManager } from '../polymorphermanager';
import { canvas, game } from '../settings';

// =============================
// Module Generic function
// =============================

export function isGMConnected(): boolean {
  return Array.from(<Users>game.users).find((user) => user.isGM && user.active) ? true : false;
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3

export function debug(msg, args = '') {
  if (game.settings.get(CONSTANTS.MODULE_NAME, 'debug')) {
    console.log(`DEBUG | ${CONSTANTS.MODULE_NAME} | ${msg}`, args);
  }
  return msg;
}

export function log(message) {
  message = `${CONSTANTS.MODULE_NAME} | ${message}`;
  console.log(message.replace('<br>', '\n'));
  return message;
}

export function notify(message) {
  message = `${CONSTANTS.MODULE_NAME} | ${message}`;
  ui.notifications?.notify(message);
  console.log(message.replace('<br>', '\n'));
  return message;
}

export function info(info, notify = false) {
  info = `${CONSTANTS.MODULE_NAME} | ${info}`;
  if (notify) ui.notifications?.info(info);
  console.log(info.replace('<br>', '\n'));
  return info;
}

export function warn(warning, notify = false) {
  warning = `${CONSTANTS.MODULE_NAME} | ${warning}`;
  if (notify) ui.notifications?.warn(warning);
  console.warn(warning.replace('<br>', '\n'));
  return warning;
}

export function error(error, notify = true) {
  error = `${CONSTANTS.MODULE_NAME} | ${error}`;
  if (notify) ui.notifications?.error(error);
  return new Error(error.replace('<br>', '\n'));
}

export function timelog(message): void {
  warn(Date.now(), message);
}

export const i18n = (key: string): string => {
  return game.i18n.localize(key)?.trim();
};

export const i18nFormat = (key: string, data = {}): string => {
  return game.i18n.format(key, data)?.trim();
};

// export const setDebugLevel = (debugText: string): void => {
//   debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
//   // 0 = none, warnings = 1, debug = 2, all = 3
//   if (debugEnabled >= 3) CONFIG.debug.hooks = true;
// };

export function dialogWarning(message, icon = 'fas fa-exclamation-triangle') {
  return `<p class="${CONSTANTS.MODULE_NAME}-dialog">
          <i style="font-size:3rem;" class="${icon}"></i><br><br>
          <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_NAME}</strong>
          <br><br>${message}
      </p>`;
}

export function cleanUpString(stringToCleanUp: string) {
  // regex expression to match all non-alphanumeric characters in string
  const regex = /[^A-Za-z0-9]/g;
  if (stringToCleanUp) {
    return i18n(stringToCleanUp).replace(regex, '').toLowerCase();
  } else {
    return stringToCleanUp;
  }
}

export function isStringEquals(stringToCheck1: string, stringToCheck2: string, startsWith = true): boolean {
  if (stringToCheck1 && stringToCheck2) {
    if (startsWith) {
      return cleanUpString(stringToCheck1).startsWith(cleanUpString(stringToCheck2));
    } else {
      return cleanUpString(stringToCheck1) === cleanUpString(stringToCheck2);
    }
  } else {
    return stringToCheck1 === stringToCheck2;
  }
}

// =========================================================================================

/**
 * Called when a token is right clicked on to display the HUD.
 * Adds a button with a icon, and adds a slash on top of it if it is already active.
 * @param {Object} app - the application data
 * @param {Object} html - the html data
 * @param {Object} hudToken - The HUD Data
 */
export async function renderAutomatedPolymorpherHud(app, html, hudToken) {
  // if only one token is selected
  if (canvas.tokens?.controlled.length == 1) {
    const sourceToken = <Token>canvas.tokens?.placeables.find((t: Token) => {
      return t.id === hudToken._id;
    });
    if (!sourceToken || !sourceToken.isOwner) {
      return;
    }

    //addToRevertPolymorphButton(html, sourceToken);
    addToPolymorphButton(html, sourceToken);
  } else {
    // Do not show anything
  }
}

function addToPolymorphButton(html, sourceToken: Token) {
  if (!sourceToken || !sourceToken.isOwner) {
    return;
  }

  const isPolymorphed = sourceToken.document.actor?.getFlag('dnd5e', 'isPolymorphed');
  let button = buildButton(html, `Transform ${sourceToken.name}`);
  if (isPolymorphed) {
    button = addSlash(button);
  }

  const random = <boolean>game.settings.get(CONSTANTS.MODULE_NAME, 'hudAvoidPanelChoice') ?? false;

  button.find('i').on('click', async (ev) => {
    API.invokePolymorpherManager(sourceToken, false, random);
  });
  button.find('i').on('contextmenu', async (ev) => {
    // Do somethign with right click
    API.invokePolymorpherManager(sourceToken, true, random);
  });
}

// function addToRevertPolymorphButton(html, sourceToken:Token) {
//   if(!sourceToken || !sourceToken.isOwner){
//     return;
//   }
//   let button = buildButton(html, `Revert transform ${sourceToken.name}`);
//   button = addSlash(button);

//   button.find('i').on('click', async (ev) => {
//     API.invokePolymorpherManager(sourceToken,true);
//   });
//   button.find('i').on('contextmenu', async (ev) => {
//     // Do something with right click
//   });
// }

function buildButton(html, tooltip) {
  const iconClass = 'fas fa-wind';
  const button = $(
    `<div class="control-icon ${CONSTANTS.MODULE_NAME}" title="${tooltip}"><i class="${iconClass}"></i></div>`,
  );
  const settingHudColClass = <string>game.settings.get(CONSTANTS.MODULE_NAME, 'hudColumn') ?? '.left';
  const settingHudTopBottomClass = <string>game.settings.get(CONSTANTS.MODULE_NAME, 'hudTopBottom') ?? 'top';

  const buttonPos = '.' + settingHudColClass.toLowerCase();

  const col = html.find(buttonPos);
  if (settingHudTopBottomClass === 'top') {
    col.prepend(button);
  } else {
    col.append(button);
  }
  return button;
}

// /**
//  * Adds the hud button to the HUD HTML
//  * @param {object} html - The HTML
//  * @param {object} data - The data
//  * @param {boolean} hasSlash - If true, the slash will be placed over the icon
//  */
// async function addButton(html, data, hasSlash = false) {
//   const button = $(`<div class="control-icon ${CONSTANTS.MODULE_NAME}"><i class="fas ${SettingsForm.getIconClass()}"></i></div>`);

//   if (hasSlash) {
//     this.addSlash(button);
//   }

//   const col = html.find(SettingsForm.getHudColumnClass());
//   if (SettingsForm.getHudTopBottomClass() == 'top') {
//     col.prepend(button);
//   } else {
//     col.append(button);
//   }

//   button.find('i').on('click', async (ev) => {
//     // do something
//     if (hasSlash) {
//       removeSlash(button);
//     } else {
//       addSlash(button);
//     }
//   });
// }

/**
 * Adds a slash icon on top of the icon to signify is active
 * @param {Object} button - The HUD button to add a slash on top of
 */
function addSlash(button) {
  const slash = $(`<i class="fas fa-slash" style="position: absolute; color: tomato"></i>`);
  button.addClass('fa-stack');
  button.find('i').addClass('fa-stack-1x');
  slash.addClass('fa-stack-1x');
  button.append(slash);
  return button;
}

/**
 * Removes the slash icon from the button to signify that it is no longer active
 * @param {Object} button - The button
 */
function removeSlash(button) {
  const slash = button.find('i')[1];
  slash.remove();
}
