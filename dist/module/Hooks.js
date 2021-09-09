import { warn, i18n, log } from "../automated-polymorpher.js";
import { APCONSTS } from "./config.js";
import { PolymorpherManager, SimplePolymorpherManager } from "./polymorphermanager.js";
import { getCanvas, getGame } from "./settings.js";
let automatedpolymorphers;
export const readyHooks = async () => {
    // setup all the hooks
    APCONSTS.animationFunctions = mergeObject(APCONSTS.animationFunctions, getGame().settings?.get(APCONSTS.MN, 'customanimations'));
    log('Automated Evocations: Animation Functions Loaded - ', APCONSTS.animationFunctions);
    const sortedAnims = Object.keys(APCONSTS.animationFunctions).sort();
    for (const k of sortedAnims) {
        const group = APCONSTS.animationFunctions[k].group || 'z-none';
        APCONSTS.animations[group] = APCONSTS.animations[group] || [];
        APCONSTS.animations[group].push({
            name: APCONSTS.animationFunctions[k]?.name || i18n(`AP.animations.${k}`),
            key: k,
        });
    }
    APCONSTS.animations = Object.keys(APCONSTS.animations)
        .sort()
        .reduce((obj, key) => {
        obj[key] = APCONSTS.animations[key];
        return obj;
    }, {});
    //new PolymorpherManager().render(true)
    if (!automatedpolymorphers) {
        automatedpolymorphers = {};
    }
    if (getGame().system.id == 'dnd5e') {
        // TODO PREPARE SOME PRESET
        automatedpolymorphers['dnd5e'] = {
            'Arcane Hand': [
                {
                    creature: 'Arcane Hand',
                    number: 1,
                },
            ],
            'Spiritual Weapon': [
                {
                    creature: 'Spiritual Weapon',
                    number: 1,
                },
            ],
            'Guardian of Faith': [
                {
                    creature: 'Spectral Guardian',
                    number: 1,
                },
            ],
            'Faithful Hound': [
                {
                    creature: 'Phantom Watchdog',
                    number: 1,
                },
            ],
            'Find Steed': [
                {
                    creature: 'Warhorse',
                    number: 1,
                },
                {
                    creature: 'Pony',
                    number: 1,
                },
                {
                    creature: 'Camel',
                    number: 1,
                },
                {
                    creature: 'Elk',
                    number: 1,
                },
                {
                    creature: 'Mastiff',
                    number: 1,
                },
            ],
            'Giant Insect': [
                {
                    creature: 'Giant Centipede',
                    number: 10,
                },
                {
                    creature: 'Giant Spider',
                    number: 3,
                },
                {
                    creature: 'Giant Wasp',
                    number: 5,
                },
                {
                    creature: 'Giant Scorpion',
                    number: 1,
                },
            ],
            'Arcane Sword': [
                {
                    creature: 'Arcane Sword',
                    number: 1,
                },
            ],
            'Conjure Animals': (data) => {
                let multiplier = 1;
                if (data.level >= 5)
                    multiplier = 2;
                if (data.level >= 7)
                    multiplier = 3;
                // const beasts = getGame().actors?.filter(
                //     (a) =>
                //       a.data.data.details.type?.value == "beast" &&
                //       a.data.data.details.cr <= 2
                //   )
                //   .sort((a, b) => {
                //     return a.data.data.details.cr < b.data.data.details.cr ? 1 : -1;
                //   });
                const creatures = [];
                // for (const beast of beasts) {
                //   let number = 1;
                //   const cr = beast.data.data.details.cr;
                //   if(cr==2) number = 1;
                //   else if(cr==1) number = 2;
                //   else if(cr==0.5) number = 4;
                //   else if(cr<=0.25) number = 8;
                //   creatures.push({
                //     creature: beast.name,
                //     number: number*multiplier,
                //   });
                // }
                return creatures;
            },
            'Conjure Celestial': (data) => {
                // const celestials = getGame().actors
                //   .filter(
                //     (a) =>
                //       a.data.data.details.type?.value == "celestial" &&
                //       a.data.data.details.cr <= 4
                //   )
                //   .sort((a, b) => {
                //     return a.data.data.details.cr < b.data.data.details.cr ? 1 : -1;
                //   });
                const creatures = [];
                // for (let celestial of celestials) {
                //   creatures.push({
                //     creature: celestial.name,
                //     number: 1,
                //   });
                // }
                return creatures;
            },
            'Conjure Elemental': (data) => {
                // const elementals = getGame().actors
                //   .filter(
                //     (a) =>
                //       a.data.data.details.type?.value == "elemental" &&
                //       a.data.data.details.cr <= data.level
                //   )
                //   .sort((a, b) => {
                //     return a.data.data.details.cr < b.data.data.details.cr ? 1 : -1;
                //   });
                const creatures = [];
                // for (let elemental of elementals) {
                //   creatures.push({
                //     creature: elemental.name,
                //     number: 1,
                //   });
                // }
                return creatures;
            },
            'Conjure Fey': (data) => {
                // const feys = getGame().actors
                //   .filter(
                //     (a) =>
                //       a.data.data.details.type?.value == "fey" &&
                //       a.data.data.details.cr <= data.level
                //   )
                //   .sort((a, b) => {
                //     return a.data.data.details.cr < b.data.data.details.cr ? 1 : -1;
                //   });
                const creatures = [];
                // for (const fey of feys) {
                //   creatures.push({
                //     creature: fey.name,
                //     number: 1,
                //   });
                // }
                return creatures;
            },
            'Conjure Minor Elementals': (data) => {
                let multiplier = 1;
                if (data.level >= 6)
                    multiplier = 2;
                if (data.level >= 8)
                    multiplier = 3;
                // const elementals = getGame().actors
                //   .filter(
                //     (a) =>
                //       a.data.data.details.type?.value == "elemental" &&
                //       a.data.data.details.cr <= 2
                //   )
                //   .sort((a, b) => {
                //     return a.data.data.details.cr < b.data.data.details.cr ? 1 : -1;
                //   });
                const creatures = [];
                // for (const elemental of elementals) {
                //   let number = 1;
                //   const cr = elemental.data.data.details.cr;
                //   if(cr==2) number = 1;
                //   else if(cr==1) number = 2;
                //   else if(cr==0.5) number = 4;
                //   else if(cr<=0.25) number = 8;
                //   creatures.push({
                //     creature: elemental.name,
                //     number: number*multiplier,
                //   });
                // }
                return creatures;
            },
            'Conjure Woodland Beings': (data) => {
                let multiplier = 1;
                if (data.level >= 6)
                    multiplier = 2;
                if (data.level >= 8)
                    multiplier = 3;
                // const feys = getGame().actors
                // .filter(
                //   (a) =>
                //     a.data.data.details.type?.value == "fey" &&
                //     a.data.data.details.cr <= data.level
                // )
                // .sort((a, b) => {
                //   return a.data.data.details.cr < b.data.data.details.cr ? 1 : -1;
                // });
                const creatures = [];
                // for (const fey of feys) {
                //   let number = 1;
                //   const cr = fey.data.data.details.cr;
                //   if(cr==2) number = 1;
                //   else if(cr==1) number = 2;
                //   else if(cr==0.5) number = 4;
                //   else if(cr<=0.25) number = 8;
                //   creatures.push({
                //     creature: fey.name,
                //     number: number*multiplier,
                //   });
                // }
                return creatures;
            },
            'Animate Dead': (data) => {
                const multiplier = 1 + (data.level - 3) * 2;
                return [
                    {
                        creature: 'Skeleton',
                        number: multiplier,
                    },
                    {
                        creature: 'Zombie',
                        number: multiplier,
                    },
                ];
            },
            'Create Undead': (data) => {
                const multiplier = data.level - 3;
                if (data.level == 8) {
                    return [
                        {
                            creature: 'Ghoul',
                            number: 5,
                        },
                        {
                            creature: 'Ghast',
                            number: 2,
                        },
                        {
                            creature: 'Wights',
                            number: 2,
                        },
                    ];
                }
                if (data.level == 9) {
                    return [
                        {
                            creature: 'Ghoul',
                            number: 6,
                        },
                        {
                            creature: 'Ghast',
                            number: 3,
                        },
                        {
                            creature: 'Wights',
                            number: 3,
                        },
                        {
                            creature: 'Mummy',
                            number: 2,
                        },
                    ];
                }
                return [
                    {
                        creature: 'Ghoul',
                        number: multiplier,
                    },
                ];
            },
            'Find Familiar': [
                {
                    creature: 'Bat',
                    number: 1,
                },
                {
                    creature: 'Cat',
                    number: 1,
                },
                {
                    creature: 'Crab',
                    number: 1,
                },
                {
                    creature: 'Frog',
                    number: 1,
                },
                {
                    creature: 'Hawk',
                    number: 1,
                },
                {
                    creature: 'Lizard',
                    number: 1,
                },
                {
                    creature: 'Octopus',
                    number: 1,
                },
                {
                    creature: 'Owl',
                    number: 1,
                },
                {
                    creature: 'Poisonous Snake',
                    number: 1,
                },
                {
                    creature: 'Quipper',
                    number: 1,
                },
                {
                    creature: 'Rat',
                    number: 1,
                },
                {
                    creature: 'Raven',
                    number: 1,
                },
                {
                    creature: 'Sea Horse',
                    number: 1,
                },
                {
                    creature: 'Spider',
                    number: 1,
                },
                {
                    creature: 'Weasel',
                    number: 1,
                },
            ],
        };
    }
    automatedpolymorphers[getGame().system.id] = mergeObject(automatedpolymorphers[getGame().system.id], getGame().settings.get(APCONSTS.MN, 'customautospells'));
    Hooks.on('getActorSheetHeaderButtons', (app, buttons) => {
        if (getGame().settings.get(APCONSTS.MN, 'hidebutton'))
            return;
        buttons.unshift({
            icon: 'fas fa-users',
            class: 'open-cm',
            label: i18n('AP.actorSheetBtn'),
            onclick: function openCM(event) {
                const appId = event.currentTarget.offsetParent.dataset.appid;
                //@ts-ignore
                const actor = ui.windows[appId].object;
                new PolymorpherManager(actor).render(true);
            },
        });
    });
    Hooks.on('createChatMessage', async (chatMessage) => {
        if (chatMessage.data.user !== getGame().user?.id || !getGame().settings.get(APCONSTS.MN, 'enableautomations')) {
            return;
        }
        const spellName = chatMessage.data.flavor ||
            getCanvas()
                .tokens?.get(chatMessage?.data?.speaker?.token)
                ?.actor?.items?.get(chatMessage?.data?.flags?.dnd5e?.roll?.itemId)?.data?.name;
        const system = automatedpolymorphers[getGame().system.id];
        if (!system) {
            return;
        }
        const creaturesCollection = system[spellName];
        if (creaturesCollection) {
            //attempt to get spell level
            let spellLevel;
            //@ts-ignore
            const midiLevel = 
            //@ts-ignore
            typeof MidiQOL !== 'undefined' && chatMessage.data.flags['midi-qol']
                ? //@ts-ignore
                    MidiQOL.Workflow.getWorkflow(chatMessage.data.flags['midi-qol'].workflowId)?.itemLevel
                : undefined;
            const brLevel = chatMessage.data.flags?.betterrolls5e?.params?.slotLevel;
            const coreLevel = $(chatMessage.data.content)?.data('spell-level');
            spellLevel = midiLevel || brLevel || coreLevel || 0;
            spellLevel = parseInt(spellLevel);
            const summonData = [];
            const data = { level: spellLevel };
            const creatures = typeof creaturesCollection === 'function' ? creaturesCollection(data) : system[spellName];
            for (const creature of creatures) {
                if (creature.level && spellLevel && creature.level >= spellLevel) {
                    continue;
                }
                const actor = getGame().actors?.getName(creature.creature);
                if (actor) {
                    summonData.push({
                        id: actor.id,
                        number: creature.number,
                        animation: creature.animation,
                    });
                }
            }
            new SimplePolymorpherManager(summonData, spellLevel, getCanvas().tokens?.get(chatMessage?.data?.speaker?.token)?.actor).render(true);
        }
    });
};
export const setupHooks = () => {
    // DO NOTHING
};
export const initHooks = () => {
    warn('Init Hooks processing');
};
