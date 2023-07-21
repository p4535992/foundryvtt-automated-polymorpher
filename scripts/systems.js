// ↓ IMPORT SYSTEMS HERE ↓
import D35E from "./systems/D35E.js";
import dnd5e from "./systems/dnd5e.js";
import generic from "./systems/generic.js";
import pf1 from "./systems/pf1.js";
import pf2e from "./systems/pf2e.js";
import swade from "./systems/swade.js";
// ↑ IMPORT SYSTEMS HERE ↑
/**
 * NOTE: YOUR PULL REQUEST WILL NOT BE ACCEPTED IF YOU DO NOT
 * FOLLOW THE CONVENTION IN THE D&D 5E SYSTEM FILE
 */
export const SYSTEMS = {
    get DATA() {
        return {
            // ↓ ADD SYSTEMS HERE ↓
            D35E,
            dnd5e,
            generic,
            pf1,
            pf2e,
            swade,
            // ↑ ADD SYSTEMS HERE ↑
        }?.[game.system.id];
    },
};
