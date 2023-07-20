import CONSTANTS from "./constants.js";
import API from "./api.js";
import { debug } from "./lib/lib.js";
import { setSocket } from "../automated-polymorpher.js";
export let automatedPolymorpherSocket;
export function registerSocket() {
    debug("Registered automatedPolymorpherSocket");
    if (automatedPolymorpherSocket) {
        return automatedPolymorpherSocket;
    }
    //@ts-ignore
    automatedPolymorpherSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);
    /**
     * Automated Polymorpher sockets
     */
    automatedPolymorpherSocket.register("invokePolymorpherManager", (...args) => API.invokePolymorpherManagerArr(...args));
    automatedPolymorpherSocket.register("invokePolymorpherManagerFromActor", (...args) => API.invokePolymorpherManagerFromActorArr(...args));
    automatedPolymorpherSocket.register("transformInto", (...args) => API.transformIntoArr(...args));
    automatedPolymorpherSocket.register("revertOriginalForm", (...args) => API.revertOriginalFormArr(...args));
    automatedPolymorpherSocket.register("cleanUpTokenSelected", (...args) => API.cleanUpTokenSelectedArr(...args));
    automatedPolymorpherSocket.register("retrieveAndPrepareActor", (...args) => API.retrieveAndPrepareActorArr(...args));
    setSocket(automatedPolymorpherSocket);
    return automatedPolymorpherSocket;
}
