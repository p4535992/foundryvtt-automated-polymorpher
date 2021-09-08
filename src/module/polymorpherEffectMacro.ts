import { ActiveEffectData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import { getCanvas, getGame } from './settings';

export const polymorpherEffectMacro = function (
  // shapeOnOff: string,
  actorOriginalFormId: string,
  actorOriginalFormImagePath: string,
  actorNewFormId: string,
  actorNewShapeName: string,
): ActiveEffectData {
  const target = <Token>getCanvas().tokens?.controlled[0];
  const actorOriginalForm = <Actor>getGame().actors?.get(actorOriginalFormId);
  const actorOriginalFormName = actorOriginalForm.data.name;
  // const actorNewForm = <Actor>getGame().actors?.get(actorNewFormId);
  const actor = <Actor>getGame().actors?.get(actorOriginalFormId);
  // // TODO WE NEED THIS ????
  // const transferDAEEffects = async function (actor) {
  //     if (actor.data.flags.dnd5e?.isPolymorphed) {
  //         const actorNewShape = <Actor>getGame().actors?.getName(actorNewShapeName);
  //         const actorNewShapeEffectsData = actorNewShape.effects.map(ef => ef.data);
  //         await actorOriginalForm.createEmbeddedDocuments("ActiveEffect", actorNewShapeEffectsData);
  //     }
  // }
  // // TODO WE NEED THIS ????
  // transferDAEEffects(actor);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  //@ts-ignore
  if (actor.data.flags.dnd5e?.isPolymorphed && shapeOnOff === 'off') {
    actorOriginalFormImagePath = <string>actorOriginalForm.data.token.img;
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
    // async function backAnimation(token:Token) {
    //     await Hooks.once("sightRefresh", async function () {
    //         //@ts-ignore
    //         await token.TMFXdeleteFilters("polymorphToOriginalForm")
    //     });
    //     //@ts-ignore
    //     await token.TMFXhasFilterId("polymorphToOriginalForm")
    //     //@ts-ignore
    //     await token.TMFXaddUpdateFilters(paramsBack)
    //     await delay(1100)
    //     //@ts-ignore
    //     await actor.revertOriginalForm()
    // }
    // backAnimation(target);
    Hooks.once('sightRefresh', async function () {
      //@ts-ignore
      await token.TMFXdeleteFilters('polymorphToOriginalForm');
    });
    //@ts-ignore
    await token.TMFXhasFilterId('polymorphToOriginalForm');
    //@ts-ignore
    await token.TMFXaddUpdateFilters(paramsBack);
    // await delay(1100);
    //@ts-ignore
    await actor.revertOriginalForm();
  }
  const actorNewShape = <Actor>getGame().actors?.getName(actorNewShapeName);
  const actorNewShapeEffectsData = actorNewShape.effects.map((ef: ActiveEffect) => ef.data);
  return actorNewShapeEffectsData[0];
};
