import { APCONSTS } from "./config.js";
export const preloadTemplates = async function () {
    const templatePaths = [
        // Add paths to "module/XXX/templates"
        //`/modules/${MODULE_NAME}/templates/XXX.html`,
        `/modules/${APCONSTS.MN}/templates/companionmanager.hbs`,
    ];
    return loadTemplates(templatePaths);
};
