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
import { canvas, game } from './module/settings';
import CONSTANTS from './module/constants';

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

Hooks.once('libChangelogsReady', function () {
  //@ts-ignore
  libChangelogs.register(CONSTANTS.MODULE_NAME, '- Official first release', 'minor');
});
