import { AUTOMATED_POLYMORPHER_MODULE_NAME } from "./settings.js";
export const preloadTemplates = async function () {
    const templatePaths = [
        // Add paths to "module/XXX/templates"
        //`/modules/${MODULE_NAME}/templates/XXX.html`,
        `/modules/${AUTOMATED_POLYMORPHER_MODULE_NAME}/templates/polymorphermanager.hbs`,
    ];
    return loadTemplates(templatePaths);
};
