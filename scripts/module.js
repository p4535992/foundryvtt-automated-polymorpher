import { warn, i18n, log, renderAutomatedPolymorpherHud } from "./lib/lib.js";
import { PolymorpherManager } from "./polymorphermanager.js";
import { ANIMATIONS } from "./animations.js";
import CONSTANTS from "./constants.js";
import API from "./api.js";
import { registerSocket } from "./socket.js";
import { setApi } from "../automated-polymorpher.js";
import { PolymorpherFlags } from "./automatedPolymorpherModels.js";
export const initHooks = () => {
    warn("Init Hooks processing");
    Hooks.once("socketlib.ready", registerSocket);
    // TODO not enter on socketlib.ready
    registerSocket();
};
export const setupHooks = () => {
    setApi(API);
};
export const readyHooks = async () => {
    // setup all the hooks
    //@ts-ignore
    ANIMATIONS.animationFunctions = mergeObject(ANIMATIONS.animationFunctions, game.settings?.get(CONSTANTS.MODULE_NAME, "customanimations"));
    log("Automated Evocations: Animation Functions Loaded - " + ANIMATIONS.animationFunctions);
    const sortedAnims = Object.keys(ANIMATIONS.animationFunctions).sort();
    for (const k of sortedAnims) {
        const group = ANIMATIONS.animationFunctions[k].group || "z-none";
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
    Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
        if (game.settings.get(CONSTANTS.MODULE_NAME, "hidebutton")) {
            return;
        }
        const actor = app.object;
        let token = app.token ? app.token : app.object.token;
        if (!token) {
            const tokens = actor.getActiveTokens() || [];
            if (tokens.length > 0) {
                token = tokens[0];
            }
        }
        if (!token) {
            token = canvas.tokens?.placeables.find((t) => {
                //@ts-ignore
                return t.document.actorId === actor.id;
            });
        }
        const useWarpGate = game.settings.get(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate");
        const isPolymorphedF = actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
        let isPolymorphed = false;
        if (String(isPolymorphedF) === "true") {
            isPolymorphed = true;
        }
        const removeLabelSheetHeader = game.settings.get(CONSTANTS.MODULE_NAME, "removeLabelSheetHeader");
        const restrictedOnlyGM = game.settings.get(CONSTANTS.MODULE_NAME, "restrictOnlyGM");
        if (restrictedOnlyGM && !game.user?.isGM) {
            //
        }
        else {
            buttons.unshift({
                icon: "fas fa-wind",
                class: "open-pm",
                label: removeLabelSheetHeader ? "" : i18n(`${CONSTANTS.MODULE_NAME}.actorSheetBtn`),
                onclick: function openPM(event) {
                    new PolymorpherManager(actor, token).render(true);
                },
            });
        }
        if (isPolymorphed && !useWarpGate) {
            buttons.unshift({
                icon: "fas fa-backward",
                class: "restore-transformation-pm",
                label: removeLabelSheetHeader ? "" : i18n(`${CONSTANTS.MODULE_NAME}.polymorphRestoreTransformationBtn`),
                onclick: async function restoreTransformation(event) {
                    const random = actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM) ?? false;
                    const ordered = actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED) ?? false;
                    if (token) {
                        await API._invokePolymorpherManagerInner(token, actor, true, ordered, random, undefined);
                    }
                    else {
                        warn(`No token is founded checkout the logs`, true);
                    }
                },
            });
        }
    });
    Hooks.on("renderActorSheet", async function (actorSheet, htmlElement, actorObject) {
        const settingHudColorButton = game.settings.get(CONSTANTS.MODULE_NAME, "hudColorButton") ?? "#b8860b";
        if (htmlElement.find(".open-pm")?.length > 0) {
            htmlElement.find(".open-pm .fa-wind")[0].style.color = `${settingHudColorButton}`;
            (htmlElement.find(".open-pm .fa-wind")[0]).style.textShadow = `0 0 8px ${settingHudColorButton}`;
        }
        const settingHudColorButtonRestoreTransformation = game.settings.get(CONSTANTS.MODULE_NAME, "hudColorButtonRestoreTransformation") ?? "#d66460";
        if (htmlElement.find(".restore-transformation-pm")?.length > 0) {
            (htmlElement.find(".restore-transformation-pm .fa-backward")[0]).style.color = `${settingHudColorButtonRestoreTransformation}`;
            (htmlElement.find(".restore-transformation-pm .fa-backward")[0]).style.textShadow = `0 0 8px ${settingHudColorButtonRestoreTransformation}`;
        }
    });
    Hooks.on("getActorDirectoryEntryContext", (html, options) => {
        const useWarpGate = game.settings.get(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate");
        if (!useWarpGate) {
            options.push({
                name: i18n(`${CONSTANTS.MODULE_NAME}.polymorphRestoreTransformationBtn`),
                icon: '<i class="fas fa-backward"></i>',
                condition: (li) => {
                    const actor = game.actors?.get(li.data("documentId"));
                    if (game.user?.isGM || (actor?.isOwner && game.user?.can("TOKEN_CONFIGURE"))) {
                        const isPolymorphedF = actor?.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.IS_POLYMORPHED);
                        let isPolymorphed = false;
                        if (String(isPolymorphedF) === "true") {
                            isPolymorphed = true;
                        }
                        return isPolymorphed;
                    }
                    else {
                        return false;
                    }
                },
                callback: async (li) => {
                    const actor = game.actors?.get(li.data("documentId"));
                    let token = undefined;
                    if (!token) {
                        const tokens = actor.getActiveTokens() || [];
                        if (tokens.length > 0) {
                            token = tokens[0];
                        }
                    }
                    if (!token) {
                        token = canvas.tokens?.placeables.find((t) => {
                            //@ts-ignore
                            return t.document.actorId === actor.id;
                        });
                    }
                    const random = actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.RANDOM) ?? false;
                    const ordered = actor.getFlag(CONSTANTS.MODULE_NAME, PolymorpherFlags.ORDERED) ?? false;
                    if (token) {
                        await API._invokePolymorpherManagerInner(token, actor, true, ordered, random, undefined);
                    }
                    else {
                        warn(`No token is founded checkout the logs`, true);
                    }
                },
            });
        }
    });
    Hooks.on("renderTokenHUD", (app, html, data) => {
        // const restrictedOnlyGM = game.settings.get(CONSTANTS.MODULE_NAME, 'restrictOnlyGM');
        // if (restrictedOnlyGM && !game.user?.isGM) {
        //   return;
        // }
        if (game.settings.get(CONSTANTS.MODULE_NAME, "hudEnable")) {
            renderAutomatedPolymorpherHud(app, html, data);
            const settingHudColorButton = game.settings.get(CONSTANTS.MODULE_NAME, "hudColorButton") ?? "#b8860b";
            if (html.find(".control-icon.automated-polymorpher .fa-wind")?.length > 0) {
                (html.find(".control-icon.automated-polymorpher .fa-wind")[0]).style.color = `${settingHudColorButton}`;
                (html.find(".control-icon.automated-polymorpher .fa-wind")[0]).style.textShadow = `0 0 8px ${settingHudColorButton}`;
            }
        }
    });
    Hooks.on("renderSettingsConfig", (app, html, data) => {
        // Add colour pickers to the Configure Game Settings: Module Settings menu
        const nameHudColorButton = `${CONSTANTS.MODULE_NAME}.hudColorButton`;
        const settingHudColorButton = game.settings.get(CONSTANTS.MODULE_NAME, "hudColorButton") ?? "#b8860b";
        $("<input>")
            .attr("type", "color")
            .attr("data-edit", nameHudColorButton)
            .val(settingHudColorButton)
            .insertAfter($(`input[name="${nameHudColorButton}"]`, html).addClass("color"));
        const nameHudColorButtonRestoreTransformation = `${CONSTANTS.MODULE_NAME}.hudColorButtonRestoreTransformation`;
        const settingHudColorButtonRestoreTransformation = game.settings.get(CONSTANTS.MODULE_NAME, "hudColorButtonRestoreTransformation") ?? "#d66460";
        $("<input>")
            .attr("type", "color")
            .attr("data-edit", nameHudColorButtonRestoreTransformation)
            .val(settingHudColorButtonRestoreTransformation)
            .insertAfter($(`input[name="${nameHudColorButtonRestoreTransformation}"]`, html).addClass("color"));
    });
};
