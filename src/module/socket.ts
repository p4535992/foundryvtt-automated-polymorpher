import CONSTANTS from './constants';
import API from './api';
import { debug } from './lib/lib';
import { setSocket } from '../automated-polymorpher';

export let automatedPolymorpherSocket;

export function registerSocket() {
  debug('Registered automatedPolymorpherSocket');
  if (automatedPolymorpherSocket) {
    return automatedPolymorpherSocket;
  }
  //@ts-ignore
  automatedPolymorpherSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);

  /**
   * Automated Polymorpher sockets
   */
  automatedPolymorpherSocket.register('invokePolymorpherManager', (...args) =>
    API.invokePolymorpherManagerArr(...args),
  );

  automatedPolymorpherSocket.register('invokePolymorpherManagerFromActor', (...args) =>
    API.invokePolymorpherManagerFromActorArr(...args),
  );

  automatedPolymorpherSocket.register('invokePolymorpherManagerFromActor', (...args) =>
    API.invokePolymorpherManagerFromActorArr(...args),
  );

  automatedPolymorpherSocket.register('transformInto', (...args) => API.transformIntoArr(...args));

  automatedPolymorpherSocket.register('revertOriginalForm', (...args) => API.revertOriginalFormArr(...args));

  /**
   * UI sockets
   */

  /**
   * Item & attribute sockets
   */

  /**
   * Effects
   */

  // Basic

  setSocket(automatedPolymorpherSocket);
  return automatedPolymorpherSocket;
}