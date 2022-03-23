import CONSTANTS from './constants';
import API from './api';
import { debug } from './lib/lib';
import { setSocket } from '../automated-polymorpher';

export const SOCKET_HANDLERS = {
  /**
   * Generic sockets
   */
  CALL_HOOK: 'callHook',

  /**
   * Item pile sockets
   */

  /**
   * UI sockets
   */

  /**
   * Item & attribute sockets
   */
};

export let automatedPolymorpherSocket;

export function registerSocket() {
  debug('Registered automatedPolymorpherSocket');
  if (automatedPolymorpherSocket) {
    return automatedPolymorpherSocket;
  }
  //@ts-ignore
  automatedPolymorpherSocket = socketlib.registerModule(CONSTANTS.MODULE_NAME);

  /**
   * Generic socket
   */
  automatedPolymorpherSocket.register(SOCKET_HANDLERS.CALL_HOOK, (hook, ...args) => callHook(hook, ...args));

  /**
   * Automated Polymorpher sockets
   */
  automatedPolymorpherSocket.register('invokePolymorpherManager', (...args) =>
    API.invokePolymorpherManagerArr(...args),
  );

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

async function callHook(inHookName, ...args) {
  const newArgs: any[] = [];
  for (let arg of args) {
    if (typeof arg === 'string') {
      const testArg = await fromUuid(arg);
      if (testArg) {
        arg = testArg;
      }
    }
    newArgs.push(arg);
  }
  return Hooks.callAll(inHookName, ...newArgs);
}
