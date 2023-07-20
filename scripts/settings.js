import CONSTANTS from "./constants.js";
import { dialogWarning, i18n, warn } from "./lib/lib.js";
import { SYSTEMS } from "./systems.js";
export const registerSettings = function () {
    game.settings.registerMenu(CONSTANTS.MODULE_NAME, "resetAllSettings", {
        name: `${CONSTANTS.MODULE_NAME}.settings.reset.name`,
        hint: `${CONSTANTS.MODULE_NAME}.settings.reset.hint`,
        icon: "fas fa-coins",
        type: ResetSettingsDialog,
        restricted: true,
    });
    // =====================================================================
    game.settings.register(CONSTANTS.MODULE_NAME, "polymorphers", {
        name: "",
        hint: "",
        scope: "client",
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
    game.settings.register(CONSTANTS.MODULE_NAME, "customanimations", {
        name: "",
        hint: "",
        scope: "world",
        config: false,
        type: Object,
        default: {},
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "autoclose", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.autoclose.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.autoclose.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "enableautomations", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.enableautomations.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.enableautomations.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
    // game.settings.register(CONSTANTS.MODULE_NAME, 'storeonactor', {
    //   name: i18n(`${CONSTANTS.MODULE_NAME}.settings.storeonactor.title`),
    //   hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.storeonactor.hint`),
    //   scope: 'world',
    //   config: true,
    //   type: Boolean,
    //   default: false,
    // });
    game.settings.register(CONSTANTS.MODULE_NAME, "hidebutton", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hidebutton.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hidebutton.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "disableSettingsForNoGM", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.disableSettingsForNoGM.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.disableSettingsForNoGM.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "restrictOwned", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOwned.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOwned.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "restrictOnlyGM", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOnlyGM.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOnlyGM.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "removeLabelSheetHeader", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.removeLabelSheetHeader.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.removeLabelSheetHeader.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "hudEnable", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudEnable.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudEnable.hint`),
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
    });
    /** Which column should the button be placed on */
    game.settings.register(CONSTANTS.MODULE_NAME, "hudColumn", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColumn.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColumn.hint`),
        scope: "client",
        config: true,
        type: String,
        default: "Left",
        choices: {
            Left: "Left",
            Right: "Right",
        },
    });
    /** Whether the button should be placed on the top or bottom of the column */
    game.settings.register(CONSTANTS.MODULE_NAME, "hudTopBottom", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudTopBottom.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudTopBottom.hint`),
        scope: "client",
        config: true,
        type: String,
        default: "Top",
        choices: {
            Top: "Top",
            Bottom: "Bottom",
        },
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "hudColorButton", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColorButton.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColorButton.hint`),
        scope: "client",
        type: String,
        default: "#b8860b",
        config: true,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "hudColorButtonRestoreTransformation", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColorButtonRestoreTransformation.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColorButtonRestoreTransformation.hint`),
        scope: "client",
        type: String,
        default: "#d66460",
        config: true,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "doNotDeleteTmpActors", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.doNotDeleteTmpActors.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.doNotDeleteTmpActors.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "forceUseOfWarpgate", {
        name: i18n(`${CONSTANTS.MODULE_NAME}.settings.forceUseOfWarpgate.title`),
        hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.forceUseOfWarpgate.hint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    // ========================================================================
    game.settings.register(CONSTANTS.MODULE_NAME, "debug", {
        name: `${CONSTANTS.MODULE_NAME}.settings.debug.name`,
        hint: `${CONSTANTS.MODULE_NAME}.settings.debug.hint`,
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
    });
    // game.settings.register(CONSTANTS.MODULE_NAME, 'debugHooks', {
    //   scope: 'world',
    //   config: false,
    //   default: false,
    //   type: Boolean,
    // });
    game.settings.register(CONSTANTS.MODULE_NAME, "systemFound", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown", {
        scope: "world",
        config: false,
        default: false,
        type: Boolean,
    });
    game.settings.register(CONSTANTS.MODULE_NAME, "preconfiguredSystem", {
        name: `${CONSTANTS.MODULE_NAME}.settings.preconfiguredSystem.name`,
        hint: `${CONSTANTS.MODULE_NAME}.settings.preconfiguredSystem.hint`,
        scope: "world",
        config: false,
        default: false,
        type: Boolean,
    });
    const settings = defaultSettings();
    for (const [name, data] of Object.entries(settings)) {
        game.settings.register(CONSTANTS.MODULE_NAME, name, data);
    }
    // for (const [name, data] of Object.entries(otherSettings)) {
    //     game.settings.register(CONSTANTS.MODULE_NAME, name, data);
    // }
};
class ResetSettingsDialog extends FormApplication {
    constructor(...args) {
        //@ts-ignore
        super(...args);
        //@ts-ignore
        return new Dialog({
            title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.title`),
            content: '<p style="margin-bottom:1rem;">' +
                game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.content`) +
                "</p>",
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.confirm`),
                    callback: async () => {
                        await applyDefaultSettings();
                        window.location.reload();
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.resetsettings.cancel`),
                },
            },
            default: "cancel",
        });
    }
    async _updateObject(event, formData) {
        // do nothing
    }
}
async function applyDefaultSettings() {
    const settings = defaultSettings(true);
    for (const [settingName, settingValue] of Object.entries(settings)) {
        await game.settings.set(CONSTANTS.MODULE_NAME, settingName, settingValue.default);
    }
    const settings2 = otherSettings(true);
    for (const [settingName, settingValue] of Object.entries(settings2)) {
        //@ts-ignore
        await game.settings.set(CONSTANTS.MODULE_NAME, settingName, settingValue.default);
    }
}
function defaultSettings(apply = false) {
    return {
        senses: {
            name: `${CONSTANTS.MODULE_NAME}.settings.polymorphSettings.name`,
            hint: `${CONSTANTS.MODULE_NAME}.settings.polymorphSettings.hint`,
            scope: "client",
            config: false,
            default: apply && SYSTEMS.DATA ? SYSTEMS.DATA.polymorphSettings : [],
            type: Array,
        },
    };
}
function otherSettings(apply = false) {
    return {
        debug: {
            name: `${CONSTANTS.MODULE_NAME}.settings.debug.name`,
            hint: `${CONSTANTS.MODULE_NAME}.settings.debug.hint`,
            scope: "client",
            config: true,
            default: false,
            type: Boolean,
        },
        // debugHooks: {
        //   name: `${CONSTANTS.MODULE_NAME}.settings.debugHooks.name`,
        //   hint: `${CONSTANTS.MODULE_NAME}.settings.debugHooks.hint`,
        //   scope: 'world',
        //   config: false,
        //   default: false,
        //   type: Boolean,
        // },
        systemFound: {
            name: `${CONSTANTS.MODULE_NAME}.settings.systemFound.name`,
            hint: `${CONSTANTS.MODULE_NAME}.settings.systemFound.hint`,
            scope: "world",
            config: false,
            default: false,
            type: Boolean,
        },
        systemNotFoundWarningShown: {
            name: `${CONSTANTS.MODULE_NAME}.settings.systemNotFoundWarningShown.name`,
            hint: `${CONSTANTS.MODULE_NAME}.settings.systemNotFoundWarningShown.hint`,
            scope: "world",
            config: false,
            default: false,
            type: Boolean,
        },
        preconfiguredSystem: {
            name: `${CONSTANTS.MODULE_NAME}.settings.preconfiguredSystem.name`,
            hint: `${CONSTANTS.MODULE_NAME}.settings.preconfiguredSystem.hint`,
            scope: "world",
            config: false,
            default: false,
            type: Boolean,
        },
        // =======================================
        polymorphers: {
            name: "",
            hint: "",
            scope: "client",
            config: false,
            type: Array,
            default: [],
        },
        // customautospells: {
        //   name: '',
        //   hint: '',
        //   scope: 'world',
        //   config: false,
        //   type: Object,
        //   default: {},
        // },
        customanimations: {
            name: "",
            hint: "",
            scope: "world",
            config: false,
            type: Object,
            default: {},
        },
        autoclose: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.autoclose.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.autoclose.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        enableautomations: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.enableautomations.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.enableautomations.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        // storeonactor: {
        //   name: i18n(`${CONSTANTS.MODULE_NAME}.settings.storeonactor.title`),
        //   hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.storeonactor.hint`),
        //   scope: 'world',
        //   config: true,
        //   type: Boolean,
        //   default: false,
        // },
        hidebutton: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hidebutton.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hidebutton.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        disableSettingsForNoGM: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.disableSettingsForNoGM.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.disableSettingsForNoGM.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        restrictOwned: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOwned.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOwned.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        restrictOnlyGM: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOnlyGM.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.restrictOnlyGM.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        removeLabelSheetHeader: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.removeLabelSheetHeader.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.removeLabelSheetHeader.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
        },
        hudEnable: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudEnable.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudEnable.hint`),
            scope: "client",
            config: true,
            type: Boolean,
            default: true,
        },
        /** Which column should the button be placed on */
        hudColumn: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColumn.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColumn.hint`),
            scope: "client",
            config: true,
            type: String,
            default: "Left",
            choices: {
                Left: "Left",
                Right: "Right",
            },
        },
        /** Whether the button should be placed on the top or bottom of the column */
        hudTopBottom: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudTopBottom.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudTopBottom.hint`),
            scope: "client",
            config: true,
            type: String,
            default: "Top",
            choices: {
                Top: "Top",
                Bottom: "Bottom",
            },
        },
        hudColorButton: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColorButton.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColorButton.hint`),
            scope: "client",
            type: String,
            default: "#b8860b",
            config: true,
        },
        hudColorButtonRestoreTransformation: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColorButtonRestoreTransformation.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.hudColorButtonRestoreTransformation.hint`),
            scope: "client",
            type: String,
            default: "#d66460",
            config: true,
        },
        doNotDeleteTmpActors: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.doNotDeleteTmpActors.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.doNotDeleteTmpActors.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
        forceUseOfWarpgate: {
            name: i18n(`${CONSTANTS.MODULE_NAME}.settings.forceUseOfWarpgate.title`),
            hint: i18n(`${CONSTANTS.MODULE_NAME}.settings.forceUseOfWarpgate.hint`),
            scope: "world",
            config: true,
            type: Boolean,
            default: false,
        },
    };
}
export async function checkSystem() {
    if (!SYSTEMS.DATA) {
        if (game.settings.get(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown"))
            return;
        await game.settings.set(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown", true);
        return Dialog.prompt({
            title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.nosystemfound.title`),
            content: dialogWarning(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.nosystemfound.content`)),
            callback: () => {
                //
            },
        });
    }
    if (game.settings.get(CONSTANTS.MODULE_NAME, "systemFound"))
        return;
    game.settings.set(CONSTANTS.MODULE_NAME, "systemFound", true);
    if (game.settings.get(CONSTANTS.MODULE_NAME, "systemNotFoundWarningShown")) {
        return new Dialog({
            title: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.systemfound.title`),
            content: warn(game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.systemfound.content`), true),
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize(`${CONSTANTS.MODULE_NAME}.dialogs.systemfound.confirm`),
                    callback: () => {
                        applyDefaultSettings();
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("No"),
                },
            },
            default: "cancel",
        }).render(true);
    }
    return applyDefaultSettings();
}
