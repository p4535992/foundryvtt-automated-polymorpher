import CONSTANTS from "./constants.js";
export const preloadTemplates = async function () {
    const templatePaths = [
        // Add paths to "module/XXX/templates"
        //`/modules/${MODULE_NAME}/templates/XXX.html`,
        `/modules/${CONSTANTS.MODULE_NAME}/templates/polymorphermanager.hbs`,
    ];
    return loadTemplates(templatePaths);
};
