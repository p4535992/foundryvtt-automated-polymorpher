/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your module, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your module
 */
// Import JavaScript modules

// Import TypeScript modules
import { preloadTemplates } from './module/preloadTemplates';
import { initHooks, readyHooks, setupHooks } from './module/module';
import { registerSettings } from './module/settings';
import CONSTANTS from './module/constants';
import type API from './module/api';

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async () => {
  console.log(`${CONSTANTS.MODULE_NAME} | Initializing ${CONSTANTS.MODULE_NAME}`);

  // Register custom module settings
  registerSettings();

  // Assign custom classes and constants here
  initHooks();

  // Preload Handlebars templates
  await preloadTemplates();
  // Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */

Hooks.once('setup', function () {
  // Do anything after initialization but before ready
  // setupModules();

  //registerSettings();

  setupHooks();
});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', () => {
  // Do anything once the module is ready
  if (!game.modules.get('sequencer')?.active && game.user?.isGM) {
    ui.notifications?.error(
      `The '${CONSTANTS.MODULE_NAME}' module requires to install and activate the 'sequencer' module.`,
    );
    return;
  }
  if (game.system.id != 'dnd5e') {
    if (!game.modules.get('warpgate')?.active && game.user?.isGM) {
      ui.notifications?.error(
        `The '${CONSTANTS.MODULE_NAME}' module requires to install and activate the 'warpgate' module.`,
      );
      return;
    }
  }
  readyHooks();
});

// Add any additional hooks if necessary

export interface AutomatedPolymorpherModuleData {
  api: typeof API;
  socket: any;
}

/**
 * Initialization helper, to set API.
 * @param api to set to game module.
 */
export function setApi(api: typeof API): void {
  const data = game.modules.get(CONSTANTS.MODULE_NAME) as unknown as AutomatedPolymorpherModuleData;
  data.api = api;
}

/**
 * Returns the set API.
 * @returns Api from games module.
 */
export function getApi(): typeof API {
  const data = game.modules.get(CONSTANTS.MODULE_NAME) as unknown as AutomatedPolymorpherModuleData;
  return data.api;
}

/**
 * Initialization helper, to set Socket.
 * @param socket to set to game module.
 */
export function setSocket(socket: any): void {
  const data = game.modules.get(CONSTANTS.MODULE_NAME) as unknown as AutomatedPolymorpherModuleData;
  data.socket = socket;
}

/*
 * Returns the set socket.
 * @returns Socket from games module.
 */
export function getSocket() {
  const data = game.modules.get(CONSTANTS.MODULE_NAME) as unknown as AutomatedPolymorpherModuleData;
  return data.socket;
}

Hooks.once('libChangelogsReady', function () {
  //@ts-ignore
  libChangelogs.register(
    CONSTANTS.MODULE_NAME,
    `
    - Merge de.json file for language
    - Bug fix: [Doesn't work in v9 latest](https://github.com/p4535992/foundryvtt-automated-polymorpher/issues/5)
    `,
    'minor',
  );
});
