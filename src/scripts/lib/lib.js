import API from "../api.js";
import { PolymorpherFlags } from "../automatedPolymorpherModels.js";
import CONSTANTS from "../constants.js";
import "../polymorphermanager.js";
import "./warpgate.js";
// =============================
// Module Generic function
// =============================
// return true or false if you, the user, should run the scripts on this actor.
export function should_I_run_this(actor) {
  let user;
  //@ts-ignore
  const { OWNER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;
  // find a non-GM who is active and owner of the actor.
  user = game.users?.find((i) => {
    const a = !i.isGM;
    const b = i.active;
    const c = actor.testUserPermission(i, OWNER);
    return a && b && c;
  });
  if (user) {
    return user === game.user;
  }
  // find a GM who is active and owner of the actor.
  user = game.users?.find((i) => {
    const a = i.isGM;
    const b = i.active;
    return a && b;
  });
  return user === game.user;
}
export function isEmptyObject(obj) {
  // because Object.keys(new Date()).length === 0;
  // we have to do some additional check
  if (obj === null || obj === undefined) {
    return true;
  }
  const result =
    obj && // null and undefined check
    Object.keys(obj).length === 0; // || Object.getPrototypeOf(obj) === Object.prototype);
  return result;
}
export function is_real_number(inNumber) {
  return !isNaN(inNumber) && typeof inNumber === "number" && isFinite(inNumber);
}
export function isGMConnected() {
  return Array.from(game.users).find((user) => user.isGM && user.active) ? true : false;
}
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3
export function debug(msg, args = "") {
  if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) {
    console.log(`DEBUG | ${CONSTANTS.MODULE_NAME} | ${msg}`, args);
  }
  return msg;
}
export function log(message) {
  message = `${CONSTANTS.MODULE_NAME} | ${message}`;
  console.log(message.replace("<br>", "\n"));
  return message;
}
export function notify(message) {
  message = `${CONSTANTS.MODULE_NAME} | ${message}`;
  ui.notifications?.notify(message);
  console.log(message.replace("<br>", "\n"));
  return message;
}
export function info(info, notify = false) {
  info = `${CONSTANTS.MODULE_NAME} | ${info}`;
  if (notify) ui.notifications?.info(info);
  console.log(info.replace("<br>", "\n"));
  return info;
}
export function warn(warning, notify = false) {
  warning = `${CONSTANTS.MODULE_NAME} | ${warning}`;
  if (notify) ui.notifications?.warn(warning);
  console.warn(warning.replace("<br>", "\n"));
  return warning;
}
export function error(error, notify = true) {
  error = `${CONSTANTS.MODULE_NAME} | ${error}`;
  if (notify) ui.notifications?.error(error);
  return new Error(error.replace("<br>", "\n"));
}
export function timelog(message) {
  warn(Date.now(), message);
}
export const i18n = (key) => {
  return game.i18n.localize(key)?.trim();
};
export const i18nFormat = (key, data = {}) => {
  return game.i18n.format(key, data)?.trim();
};
// export const setDebugLevel = (debugText: string): void => {
//   debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
//   // 0 = none, warnings = 1, debug = 2, all = 3
//   if (debugEnabled >= 3) CONFIG.debug.hooks = true;
// };
export function dialogWarning(message, icon = "fas fa-exclamation-triangle") {
  return `<p class="${CONSTANTS.MODULE_NAME}-dialog">
          <i style="font-size:3rem;" class="${icon}"></i><br><br>
          <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_NAME}</strong>
          <br><br>${message}
      </p>`;
}
export function cleanUpString(stringToCleanUp) {
  // regex expression to match all non-alphanumeric characters in string
  const regex = /[^A-Za-z0-9]/g;
  if (stringToCleanUp) {
    return i18n(stringToCleanUp).replace(regex, "").toLowerCase();
  } else {
    return stringToCleanUp;
  }
}
export function isStringEquals(stringToCheck1, stringToCheck2, startsWith = false) {
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
  // if (canvas.tokens?.controlled.length == 1) {
  const sourceToken = canvas.tokens?.placeables.find((t) => {
    return t.id === hudToken._id;
  });
  if (!sourceToken || !sourceToken.isOwner) {
    return;
  }
  const actor = retrieveActorFromToken(sourceToken);
  if (!actor) {
    // warn(`No actor founded on canvas with token '${sourceToken.id}'`, true);
    return;
  }
  const listPolymorphers =
    // actor &&
    // (<boolean>actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_LOCAL) ||
    //   game.settings.get(CONSTANTS.MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR))
    //   ? <PolymorpherData[]>actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || []
    //   : <PolymorpherData[]>game.user?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];
    actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.POLYMORPHERS) || [];
  if (listPolymorphers.length > 0) {
    //addToRevertPolymorphButton(html, sourceToken);
    addToPolymorphButton(html, sourceToken);
    // } else {
    //   // Do not show anything
    // }
  }
}
function addToPolymorphButton(html, sourceToken) {
  if (!sourceToken || !sourceToken.isOwner) {
    return;
  }
  const button = buildButton(html, `Transform ${sourceToken.name}`);
  // if (isPolymorphed) {
  //   button = addSlash(button);
  // }
  const sourceActor = retrieveActorFromToken(sourceToken);
  if (!sourceActor) {
    warn(`No actor founded on canvas with token '${sourceToken.id}'`);
    return;
  }
  const random = sourceActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM) ?? false;
  const ordered = sourceActor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED) ?? false;
  // const storeonactor = <boolean>actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR) ?? false;
  button.find("i").on("click", async (ev) => {
    for (const targetToken of canvas.tokens?.controlled) {
      const targetActor = retrieveActorFromToken(targetToken);
      if (targetActor) {
        await API._invokePolymorpherManagerInner(targetToken, targetActor, false, ordered, random, undefined);
      }
    }
  });
  button.find("i").on("contextmenu", async (ev) => {
    for (const targetToken of canvas.tokens?.controlled) {
      // Do somethign with right click
      const targetActor = retrieveActorFromToken(targetToken);
      const originalActorId = targetActor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);
      const originalActor = game.actors?.get(originalActorId);
      if (targetActor) {
        await API._invokePolymorpherManagerInner(targetToken, targetActor, true, ordered, random, undefined);
      }
    }
  });
}
function buildButton(html, tooltip) {
  const iconClass = "fas fa-wind"; // TODO customize icon ???
  const button = $(
    `<div class="control-icon ${CONSTANTS.MODULE_NAME}" title="${tooltip}"><i class="${iconClass}"></i></div>`
  );
  const settingHudColClass = game.settings.get(CONSTANTS.MODULE_NAME, "hudColumn") ?? "left";
  const settingHudTopBottomClass = game.settings.get(CONSTANTS.MODULE_NAME, "hudTopBottom") ?? "top";
  const buttonPos = "." + settingHudColClass.toLowerCase();
  const col = html.find(buttonPos);
  if (settingHudTopBottomClass.toLowerCase() === "top") {
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
  button.addClass("fa-stack");
  button.find("i").addClass("fa-stack-1x");
  slash.addClass("fa-stack-1x");
  button.append(slash);
  return button;
}
/**
 * Removes the slash icon from the button to signify that it is no longer active
 * @param {Object} button - The button
 */
function removeSlash(button) {
  const slash = button.find("i")[1];
  slash.remove();
}
export function retrieveActorFromToken(sourceToken) {
  if (!sourceToken.actor) {
    return undefined;
  }
  // const storeOnActorFlag = <boolean>sourceToken.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.STORE_ON_ACTOR);
  // if (!storeOnActorFlag) {
  //   return sourceToken.actor;
  // }
  let actor = undefined;
  //@ts-ignore
  if (sourceToken.document.actorLink) {
    //@ts-ignore
    actor = game.actors?.get(sourceToken.document.actorId);
  }
  // DO NOT NEED THIS
  // if(!actor){
  //   actor = <Actor>game.actors?.get(<string>sourceToken.actor?.id);
  // }
  if (!actor) {
    actor = sourceToken.actor;
  }
  return actor;
}
// export async function retrieveActorFromData(
// 	aId: string,
// 	aName: string,
// 	currentCompendium: string
// ): Promise<Actor | null> {
// 	let actorToTransformLi: Actor | null = null;
// 	if (currentCompendium && currentCompendium != "none" && currentCompendium != "nonenodelete") {
// 		const pack = game.packs.get(currentCompendium);
// 		if (pack) {
// 			await pack.getIndex();
// 			/*
//       for (const entityComp of pack.index) {
//         const actorComp = <Actor>await pack.getDocument(entityComp._id);
//         if (actorComp.id === aId || actorComp.name === aName) {
//           actorToTransformLi = actorComp;
//           break;
//         }
//       }
//       */
// 			// If the actor is found in the index, return it by exact ID
// 			if (pack.index.get(aId)) {
// 				actorToTransformLi = <Actor>await pack.getDocument(aId);
// 			}
// 			// If not found, search for the actor by name
// 			if (!actorToTransformLi) {
// 				for (const entityComp of pack.index) {
// 					const actorComp = <StoredDocument<Actor>>await pack.getDocument(entityComp._id);
// 					if (actorComp.id === aId || actorComp.name === aName) {
// 						actorToTransformLi = actorComp;
// 						break;
// 					}
// 				}
// 			}
// 		}
// 	}
// 	if (!actorToTransformLi) {
// 		actorToTransformLi = <Actor>game.actors?.contents.find((a) => {
// 			return a.id === aId || a.name === aName;
// 		});
// 	}
// 	return actorToTransformLi;
// }
/* returns the actor data sans ALL embedded collections */
export function _getRootActorData(actorDoc) {
  const actorData = actorDoc.toObject();
  /* get the key NAME of the embedded document type.
   * ex. not 'ActiveEffect' (the class name), 'effect' the collection's field name
   */
  //@ts-ignore
  const embeddedFields = Object.values(Actor.implementation.metadata.embedded).map(
    //@ts-ignore
    (thisClass) => thisClass.metadata.collection
  );
  /* delete any embedded fields from the actor data */
  embeddedFields.forEach((field) => {
    delete actorData[field];
  });
  return actorData;
}
// TODO TO INTEGRATE FOR TRANSFER
export function transferItemsActor(
  sourceActor,
  targetActor,
  originalItemId,
  createdItem,
  originalQuantity,
  transferedQuantity,
  stackItems
) {
  const originalItem = sourceActor?.items.get(originalItemId);
  if (originalItem == undefined) {
    console.error("Could not find the source item", originalItemId);
    return;
  }
  if (transferedQuantity > 0 && transferedQuantity <= originalQuantity) {
    const newOriginalQuantity = originalQuantity - transferedQuantity;
    let stacked = false; // will be true if a stack of item has been found and items have been stacked in it
    if (stackItems) {
      const potentialStacks = targetActor?.items.filter(
        (i) => i.name == originalItem.name && diffObject(createdItem, i) && i.id !== createdItem.id
      );
      if (potentialStacks.length >= 1) {
        //@ts-ignore
        const newQuantity = potentialStacks[0].system.quantity + transferedQuantity;
        potentialStacks[0]?.update({ "system.quantity": newQuantity });
        // deleteItemIfZero(targetSheet, <string>createdItem.id);
        stacked = true;
      }
    }
    originalItem.update({ "system.quantity": newOriginalQuantity }).then((i) => {
      if (i) {
        const sh = i.actor?.sheet;
        //@ts-ignore
        deleteItemIfZero(sh, i.id);
      }
    });
    if (stacked === false) {
      //@ts-ignore
      createdItem.system.quantity = transferedQuantity;
      //@ts-ignore
      targetActor?.createEmbeddedDocuments("Item", [createdItem]);
    }
  } else {
    error("could not transfer " + transferedQuantity + " items", true);
  }
}
export async function retrieveActorFromData(aUuid, aId, aName, currentCompendium, createOnWorld) {
  let actorToTransformLi = null;
  if (!aId && !aName) {
    return null;
  }
  if (aUuid) {
    //@ts-ignore
    actorToTransformLi = await Actor.implementation.fromDropData({ type: "Actor", uuid: aUuid });
    if (aUuid.toLowerCase().includes("compendium")) {
      if (actorToTransformLi && createOnWorld && (game.user?.isGM || should_I_run_this(actorToTransformLi))) {
        //const packId = aUuid.replace("Compendium.", "").replace("." + aId, "");
        const pack = game.packs.get(currentCompendium);
        if (pack) {
          await pack.getIndex();
          // If the actor is found in the index, return it by exact ID
          if (pack.index.get(aId)) {
            actorToTransformLi = await pack.getDocument(aId);
          }
          // If not found, search for the actor by name
          if (!actorToTransformLi) {
            for (const entityComp of pack.index) {
              const actorComp = await pack.getDocument(entityComp._id);
              if (actorComp.id === aId || actorComp.name === aName) {
                actorToTransformLi = actorComp.toObject();
                break;
              }
            }
          } else {
            actorToTransformLi = actorToTransformLi.toObject();
          }
        }
        // Create actor from compendium
        // const collection = <any>game.collections.get(pack.documentName);
        // const id = <string>actorToTransformLi.id; // li.data("document-id");
        // actorToTransformLi = <Actor>await collection.importFromCompendium(pack, id, {}, { renderSheet: false });
      }
    }
    if (actorToTransformLi) {
      return actorToTransformLi;
    }
  }
  actorToTransformLi = game.actors?.contents.find((a) => {
    return a.id === aId || a.name === aName;
  });
  if (!actorToTransformLi && currentCompendium && currentCompendium != "none" && currentCompendium != "nonenodelete") {
    const pack = game.packs.get(currentCompendium);
    if (pack) {
      await pack.getIndex();
      // If the actor is found in the index, return it by exact ID
      if (pack.index.get(aId)) {
        actorToTransformLi = await pack.getDocument(aId);
      }
      // If not found, search for the actor by name
      if (!actorToTransformLi) {
        for (const entityComp of pack.index) {
          const actorComp = await pack.getDocument(entityComp._id);
          if (actorComp.id === aId || actorComp.name === aName) {
            actorToTransformLi = actorComp.toObject();
            break;
          }
        }
      } else {
        actorToTransformLi = actorToTransformLi.toObject();
      }
    }
    // if (actorToTransformLi && createOnWorld && (game.user?.isGM || should_I_run_this(actorToTransformLi))) {
    // 	// Create actor from compendium
    // 	const collection = <any>game.collections.get(pack.documentName);
    // 	const id = actorToTransformLi.id; // li.data("document-id");
    // 	actorToTransformLi = await collection.importFromCompendium(pack, id, {}, { renderSheet: false });
    // }
  }
  if (!actorToTransformLi) {
    actorToTransformLi = game.actors?.contents.find((a) => {
      return a.id === aId || a.name === aName;
    });
  }
  return actorToTransformLi;
}
export async function rollFromString(rollString, actor) {
  let myvalue = 0;
  if (!rollString) {
    // Ignore ???
    if (rollString === "0") {
      myvalue = 0;
    } else {
      myvalue = 1;
    }
  } else {
    if (String(rollString).toLowerCase().includes("data.") || String(rollString).toLowerCase().includes("system.")) {
      const formula = rollString.replace(/data\./g, "@").replace(/system\./g, "@");
      const data = actor ? actor.getRollData() : {};
      const roll = new Roll(formula, data);
      // Roll the dice.
      let myresult = 0;
      //roll.roll();
      try {
        // to evaluation options to nominate your preferred behavior.
        await roll.evaluate({ async: true });
        //await roll.evaluate({async: true});
        myresult = roll.total ? roll.total : parseInt(roll.result);
      } catch (e) {
        myresult = parseInt(eval(roll.result));
      }
      if (!is_real_number(myresult)) {
        warn(`The formula '${formula}' doesn't return a number we set the default 1`);
        myvalue = 1;
      } else {
        myvalue = myresult;
      }
    } else if (!is_real_number(rollString)) {
      const formula = rollString;
      const data = actor ? actor.getRollData() : {};
      const roll = new Roll(formula, data);
      // Roll the dice.
      let myresult = 0;
      //roll.roll();
      try {
        // to evaluation options to nominate your preferred behavior.
        await roll.evaluate({ async: true });
        //await roll.evaluate({async: true});
        myresult = roll.total ? roll.total : parseInt(roll.result);
      } catch (e) {
        myresult = parseInt(eval(roll.result));
      }
      if (!is_real_number(myresult)) {
        warn(`The formula '${formula}' doesn't return a number we set the default 1`);
        myvalue = 1;
      } else {
        myvalue = myresult;
      }
    } else if (is_real_number(rollString)) {
      myvalue = Number(rollString);
    } else {
      myvalue = 0;
    }
  }
  return myvalue;
}
export async function transferPermissionsActorInner(sourceActor, targetActor, externalUserId) {
  // if (!game.user.isGM) throw new Error("You do not have the ability to configure permissions.");
  // let sourceActor = //actor to copy the permissions from
  // let targetActor = //actor to copy the permissions to
  // The important part is the {diff:false, recursive: false},
  // which ensures that any undefined parts of the permissions object
  // are not filled in by the existing permissions on the target actor
  // const user = game.users.get(userId);
  // if (externalUserId) {
  // 	// Set ownership
  // 	const ownershipLevels = {};
  // 	ownershipLevels[externalUserId] = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
  // 	// Update a single Document
  // 	await targetActor.update({ ownership: ownershipLevels }, { diff: false, recursive: false, noHook: true });
  // }
  // For a straight duplicate of permissions, you should be able to just do:
  // return await targetActor.update({ permission: _getHandPermission(sourceActor) }, { diff: false, recursive: false, noHook: true });
  return await targetActor.update(
    { ownership: _getHandPermission(sourceActor, externalUserId) },
    { diff: false, recursive: false, noHook: true }
  );
}
//this method is on the actor, so "this" is the actor document
function _getHandPermission(actor, externalUserId) {
  const handPermission = duplicate(actor.ownership); // actor.permission
  for (const key of Object.keys(handPermission)) {
    //remove any permissions that are not owner
    if (handPermission[key] < CONST.DOCUMENT_PERMISSION_LEVELS.OWNER) {
      delete handPermission[key];
    }
    //set default permission to none/limited/observer
    handPermission.default = CONST.DOCUMENT_PERMISSION_LEVELS.NONE; // CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER
  }
  if (!handPermission[externalUserId] || handPermission[externalUserId] < CONST.DOCUMENT_PERMISSION_LEVELS.OWNER) {
    handPermission[externalUserId] = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
  }
  return handPermission;
}
export async function revertFlagsOnActor(original) {
  if (original && hasProperty(original, `flags.${CONSTANTS.MODULE_NAME}`)) {
    await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
    // await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
    const arr = original.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
    arr.pop();
    await original?.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR, arr);
    // await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
    await original.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);
    for (const token of original.getActiveTokens()) {
      if (token.actor) {
        if (token.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED) != undefined) {
          await token.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
        }
        if (
          token.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR) != undefined
        ) {
          const arr = original.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR);
          arr.pop();
          await token.actor?.setFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.PREVIOUS_TOKEN_DATA_ORIGINAL_ACTOR, arr);
        }
        // if (
        // 	token.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT) != undefined
        // ) {
        // 	await token.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.MUTATION_NAMES_FOR_REVERT);
        // }
        if (token.actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR) != undefined) {
          await token.actor?.unsetFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORIGINAL_ACTOR);
        }
      }
    }
  }
}
export const evaluateExpression = async function (expression, ...args) {
  if (!expression) return null;
  const AsyncFunction = async function () {}.constructor;
  //@ts-ignore
  const fn = new AsyncFunction("args", $("<span />", { html: expression }).text());
  try {
    return await fn(args);
  } catch (e) {
    error("There was an error in your macro syntax. See the console (F12) for details", true);
    error(e);
    return undefined;
  }
};
