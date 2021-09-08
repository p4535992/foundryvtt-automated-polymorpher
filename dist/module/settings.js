import { i18n } from "../automated-polymorpher.js";
import { APCONSTS } from "./config.js";
// import ImagePicker from "./libs/ImagePicker";
// import SoundPicker from "./libs/SoundPicker";
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
export function getCanvas() {
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
export function getGame() {
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
    getGame().settings.register(APCONSTS.MN, 'customautospells', {
        name: '',
        hint: '',
        scope: 'world',
        config: false,
        type: Object,
        default: {},
    });
    getGame().settings.register(APCONSTS.MN, 'customanimations', {
        name: '',
        hint: '',
        scope: 'world',
        config: false,
        type: Object,
        default: {},
    });
    getGame().settings.register(APCONSTS.MN, 'autoclose', {
        name: i18n(`${APCONSTS.MN}.settings.autoclose.title`),
        hint: i18n(`${APCONSTS.MN}.settings.autoclose.hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });
    getGame().settings.register(APCONSTS.MN, 'enableautomations', {
        name: i18n(`${APCONSTS.MN}.settings.enableautomations.title`),
        hint: i18n(`${APCONSTS.MN}.settings.enableautomations.hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
    });
    getGame().settings.register(APCONSTS.MN, 'storeonactor', {
        name: i18n(`${APCONSTS.MN}.settings.storeonactor.title`),
        hint: i18n(`${APCONSTS.MN}.settings.storeonactor.hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });
    getGame().settings.register(APCONSTS.MN, 'hidebutton', {
        name: i18n(`${APCONSTS.MN}.settings.hidebutton.title`),
        hint: i18n(`${APCONSTS.MN}.settings.hidebutton.hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });
    getGame().settings.register(APCONSTS.MN, 'restrictOwned', {
        name: i18n(`${APCONSTS.MN}.settings.restrictOwned.title`),
        hint: i18n(`${APCONSTS.MN}.settings.restrictOwned.hint`),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });
};
