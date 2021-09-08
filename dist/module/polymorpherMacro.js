import { polymorpherEffectMacro } from "./polymorpherEffectMacro.js";
import { getCanvas, getGame } from "./settings.js";
export const polymorpherMacro = async function () {
    // Declare the target
    const target = getCanvas().tokens?.controlled[0];
    const token = target;
    // Get the ID of your the actual target (current Actor Form)
    const currentFormActorId = target.actor?.data._id;
    const actor = getGame().actors?.get(currentFormActorId);
    // Declare my WildShape transformation function
    const wildShapeTransform = async function (actorOriginalForm, actorNewFormId) {
        // Image's Token associated with the original actor form
        let actorOriginalFormImagePath = actorOriginalForm.data.token.img;
        const actorOriginalFormWidth = actorOriginalForm.data.token.width;
        const actorOriginalFormHeight = actorOriginalForm.data.token.height;
        // Get the New Form Actor
        const actorNewForm = getGame().actors?.get(actorNewFormId);
        // Set the token rotation to default value
        actorNewForm.data.token.rotation = 0;
        // Image's Token associated with the new actor form
        const actorNewFormImagePath = actorNewForm.data.token.img;
        // Get the New Shape Actor Name
        const actorNewShapeName = actorOriginalForm.data.name + ' (' + actorNewForm.data.name + ')';
        // Declare the polymorph function
        const actorPolymorphism = async function () {
            // For actorNewForm, the ratio's Token scale should be the same of the original form
            //@ts-ignore
            actor.transformInto(actorNewForm, {
                keepMental: true,
                mergeSaves: true,
                mergeSkills: true,
                keepBio: true,
                keepClass: true,
            });
        };
        // [REMOVED] Declare the WildShape Effect
        // let applyWildShapeEffect:ActiveEffect.Data = {
        //     _id: actor.id,
        //     label: wildShapeEffectName,
        //     icon: "systems/dnd5e/icons/skills/green_13.jpg",
        //     changes: [{
        //         key: "macro.execute",
        //         mode: ACTIVE_EFFECT_MODES.MULTIPLY,//1,
        //         value: `"${wildShapeEffectNameMacro}"` + `"${currentFormActorId}"` + `"${actorOriginalFormImagePath}"` + `"${actorNewFormId}"` + `"${actorNewShapeName}"`,
        //         priority: 20
        //     }],
        //     duration: {
        //         "seconds": 7200,
        //     },
        //     flags:{}
        // }
        // Declare the delay variable to adjust with animation
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        // If not already polymorphed, launch startAnimation function
        //@ts-ignore
        if (!actor.data.flags.dnd5e?.isPolymorphed) {
            const paramsStart = [
                {
                    filterType: 'polymorph',
                    filterId: 'polymorphToNewForm',
                    type: 6,
                    padding: 70,
                    magnify: 1,
                    imagePath: actorNewFormImagePath,
                    animated: {
                        progress: {
                            active: true,
                            animType: 'halfCosOscillation',
                            val1: 0,
                            val2: 100,
                            loops: 1,
                            loopDuration: 1000,
                        },
                    },
                    autoDisable: false,
                    autoDestroy: false,
                },
            ];
            target.document.update({
                width: actorNewForm.data.token.width,
                height: actorNewForm.data.token.height,
            });
            // async function startAnimation(token) {
            //   await Hooks.once('createActiveEffect', async function () {
            //     await token.TMFXdeleteFilters('polymorphToNewForm');
            //   });
            //   await token.TMFXhasFilterId('polymorphToNewForm');
            //   //@ts-ignore
            //   await TokenMagic.addUpdateFilters(target, paramsStart);
            //   await delay(1100);
            //   await actorPolymorphism();
            //   await Hooks.once('sightRefresh', async function () {
            //     let actorNewShape: Actor = getGame().actors.getName(actorNewShapeName);
            //     //await actorNewShape.createEmbeddedEntity("ActiveEffect", WildShapeEffectMacro(wildShapeEffectNameMacro,currentFormActorId,actorOriginalFormImagePath,actorNewFormId,actorNewShapeName));
            //     let effect = WildShapeEffectMacro(
            //       wildShapeEffectNameMacro,
            //       currentFormActorId,
            //       actorOriginalFormImagePath,
            //       actorNewFormId,
            //       actorNewShapeName,
            //     );
            //     handleEffectToggleEvent(token, effect);
            //   });
            //   // let actorNewShape:Actor = getGame().actors.getName(actorNewShapeName);
            //   // await actorNewShape.createEmbeddedEntity("ActiveEffect", WildShapeEffectMacro(wildShapeEffectNameMacro,currentFormActorId,actorOriginalFormImagePath,actorNewFormId,actorNewShapeName));
            // }
            // startAnimation(target);
            await Hooks.once('createActiveEffect', async function () {
                //@ts-ignore
                await token.TMFXdeleteFilters('polymorphToNewForm');
            });
            //@ts-ignore
            await token.TMFXhasFilterId('polymorphToNewForm');
            //@ts-ignore
            await TokenMagic.addUpdateFilters(target, paramsStart);
            await delay(1100);
            await actorPolymorphism();
            await Hooks.once('sightRefresh', async function () {
                const actorNewShape = getGame().actors?.getName(actorNewShapeName);
                //await actorNewShape.createEmbeddedEntity("ActiveEffect", WildShapeEffectMacro(wildShapeEffectNameMacro,currentFormActorId,actorOriginalFormImagePath,actorNewFormId,actorNewShapeName));
                const effect = polymorpherEffectMacro(currentFormActorId, actorOriginalFormImagePath, actorNewFormId, actorNewShapeName);
            });
            // If actor is polymorphed, launch backAnimation function
        }
        else {
            // Image's Token associated with the original actor form
            actorOriginalFormImagePath = actorOriginalForm.data.token.img;
            const paramsBack = [
                {
                    filterType: 'polymorph',
                    filterId: 'polymorphToOriginalForm',
                    type: 6,
                    padding: 70,
                    magnify: 1,
                    imagePath: actorOriginalFormImagePath,
                    animated: {
                        progress: {
                            active: true,
                            animType: 'halfCosOscillation',
                            val1: 0,
                            val2: 100,
                            loops: 1,
                            loopDuration: 1000,
                        },
                    },
                },
            ];
            target.document.update({
                width: actorOriginalForm.data.token.width,
                height: actorOriginalForm.data.token.height,
            });
            // async function backAnimation(token) {
            //   await token.TMFXdeleteFilters('polymorphToOriginalForm');
            //   await token.TMFXhasFilterId('polymorphToOriginalForm');
            //   await token.TMFXaddUpdateFilters(paramsBack);
            //   await delay(1100);
            //   //@ts-ignore
            //   await actor.revertOriginalForm();
            //   await token.TMFXdeleteFilters('polymorphToOriginalForm');
            // }
            // backAnimation(target);
            //@ts-ignore
            await token.TMFXdeleteFilters('polymorphToOriginalForm');
            //@ts-ignore
            await token.TMFXhasFilterId('polymorphToOriginalForm');
            //@ts-ignore
            await token.TMFXaddUpdateFilters(paramsBack);
            await delay(1100);
            //@ts-ignore
            await actor.revertOriginalForm();
            //@ts-ignore
            await token.TMFXdeleteFilters('polymorphToOriginalForm');
        }
        // Pacth bug we lose correct width and height with diefferent size tokens
        target.document.update({
            width: actorOriginalFormWidth,
            height: actorOriginalFormHeight,
        });
    };
    // // If not already polymorphed, display the dialog box
    // //@ts-ignore
    // if (!actor.data.flags.dnd5e?.isPolymorphed) {
    //   const actorOriginalForm = <Actor>getGame().actors?.get(currentFormActorId);
    //   let selectBeasts = '<form><div class="form-group"><label>Choose the beast: </label><select id="wildShapeBeasts">';
    //   let beastsFolder = <string>getGame().settings.get(MODULE_NAME, 'beastsFolder');
    //   if (!getGame().folders.getName(beastsFolder)) {
    //     error("Can't find folder with name '" + beastsFolder + "'");
    //   }
    //   //@ts-ignore
    //   getGame().folders.getName(beastsFolder).content.forEach(function (beast) {
    //     let optBeast = '<option value="' + beast.data._id + '">' + beast.data.name + '</option>';
    //     selectBeasts += optBeast;
    //   });
    //   selectBeasts += '</select></div></form>';
    //   new Dialog({
    //     title: 'DnD5e-WildShape',
    //     content: selectBeasts,
    //     buttons: {
    //       yes: {
    //         icon: '<i class="fas fa-paw"></i>',
    //         label: 'Roar!',
    //         callback: async () => {
    //           // Get the New Form Actor ID
    //           let actorNewFormId = String($('#wildShapeBeasts').find(':selected').val());
    //           wildShapeTransform(actorOriginalForm, actorNewFormId);
    //           // TODO MAKE THIS A BETTER CODE
    //           await actor.update({ 'flags.dnd5e.isPolymorphed': true });
    //           await actor.update({ 'data.flags.foundryvtt-dnd5e-wildshape.actorOriginalForm': actorOriginalForm });
    //           await actor.update({ 'data.flags.foundryvtt-dnd5e-wildshape.actorNewFormId': actorNewFormId });
    //           // await actor.update({ "data.flags.foundryvtt-dnd5e-wildshape.tokenOriginal.width": actor.data.token.width});
    //           // await actor.update({ "data.flags.foundryvtt-dnd5e-wildshape.tokenOriginal.height": actor.data.token.height});
    //         },
    //       },
    //     },
    //     default: '',
    //   }).render(true);
    //   // Else, launch the WildShape transformation function
    // } else {
    //   let actorOriginalForm = getGame().actors.get(currentFormActorId);
    //   // TODO MAKE THIS A BETTER CODE
    //   let actorOriginalFormTmp = getProperty(actor, 'data.flags.foundryvtt-dnd5e-wildshape.actorOriginalForm');
    //   let actorNewFormIdTmp = getProperty(actor, 'data.flags.foundryvtt-dnd5e-wildshape.actorNewFormId');
    //   // let tokenOriginalTmpWidth = getProperty(actor, "data.flags.foundryvtt-dnd5e-wildshape.tokenOriginal.width");
    //   // let tokenOriginalTmpHeight = getProperty(actor, "data.flags.foundryvtt-dnd5e-wildshape.tokenOriginal.height");
    //   await actor.update({ 'flags.dnd5e.isPolymorphed': false });
    //   await actor.update({ 'data.flags.foundryvtt-dnd5e-wildshape.actorOriginalForm': null });
    //   await actor.update({ 'data.flags.foundryvtt-dnd5e-wildshape.actorNewFormId': null });
    //   // PATCH BUG FIX HEIGHT AND WIDTH BETWEEN TOKEN WITH DIFFERENT SIZE
    //   let actorNewForm = getGame().actors.get(actorNewFormIdTmp);
    //   // await actorNewForm.update({ "data.token.width": actorOriginalFormTmp.data.token.width });
    //   // await actorNewForm.update({ "data.token.height": actorOriginalFormTmp.data.token.height });
    //   wildShapeTransform(actorOriginalFormTmp, actorNewFormIdTmp);
    // }
};
