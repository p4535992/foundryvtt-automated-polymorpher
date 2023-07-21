#  FoundryVTT Automated Polymorpher

![Latest Release Download Count](https://img.shields.io/github/downloads/p4535992/foundryvtt-automated-polymorpher/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge)

[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fautomated-polymorpher&colorB=006400&style=for-the-badge)](https://forge-vtt.com/bazaar#package=automated-polymorpher)

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fp4535992%2Ffoundryvtt-automated-polymorpher%2Fmaster%2Fsrc%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=orange&style=for-the-badge)

![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fp4535992%2Ffoundryvtt-automated-polymorpher%2Fmaster%2Fsrc%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)

[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fautomated-polymorpher%2Fshield%2Fendorsements&style=for-the-badge)](https://www.foundryvtt-hub.com/package/automated-polymorpher/)

[![Translation status](https://weblate.foundryvtt-hub.com/widgets/automated-polymorpher/-/287x66-black.png)](https://weblate.foundryvtt-hub.com/engage/automated-polymorpher/)

### If you want to buy me a coffee [![alt-text](https://img.shields.io/badge/-Patreon-%23ff424d?style=for-the-badge)](https://www.patreon.com/p4535992)

# NOTE: The module is just for personal use only and is been "removed" from the official module list for avoid license issues with the module [automated-evocations](https://github.com/theripper93/automated-evocations), if anyone plans to retake the module let them know first at [theRipper93](https://github.com/theripper93) to avoid any kind of problems.

### [BETA] Due to several issues that I cannot solve (details on the github project), the module has been categorized as beta, there is an open commission on the league server for anyone interested in support a module with these features https://discord.com/channels/732325252788387980/1076817951623229500.

A user interface to manage the polymorph feature for summoning with animations.

**Note: This is module is inspired from the  wonderful work done by [theRipper93](https://github.com/theripper93) with its [automated-evocations](https://github.com/theripper93/automated-evocations) module.
If you want to support more modules of this kind, I invite you to go and support his patreon**

[![alt-text](https://img.shields.io/badge/-Patreon-%23ff424d?style=for-the-badge)](https://www.patreon.com/theripper93) [![alt-text](https://img.shields.io/badge/-Discord-%235662f6?style=for-the-badge)](https://discord.gg/F53gBjR97G)

Should work with all system supported from the [warpgate](https://github.com/trioderegion/warpgate) module "mutate" function, but for now the module is only used and tested with the Dnd5e system and the polymorph mechanism.

![gif](./wiki/feature_automated_polymorhper.gif)
![hud](./wiki/feature_hud_1.gif)

## NOTE this module work very well with this other module [Automated Evocations (Variant Fork)](https://github.com/p4535992/automated-evocations-variant) and  [Automated Evocations](https://github.com/theripper93/automated-evocations)

## NOTE: If you are a javascript developer and not a typescript developer, you can just use the javascript files under the dist folder

## Known issue/Limitation

- The module need a full rewrite ....

## How contribute to your own multisystem

I don't have time for check every system attributes and skill need help from the community for accomplish this, every system file has a method called `

```
  async prepareDataFromTransformOptions(
    originalActorData: Actor,
    targetActorData: Actor,
    sourceEffects: any[],
    targetActorImages: string[],
    transformOptions: TransformOptionsGeneric,
  ):Promise<any>
```
where usually as common values i use these:
```
const targetActorImages = await targetActor.getTokenImages();
const sourceEffects = sourceToken.actor ? sourceToken.actor.effects : sourceToken.effects;
const transformOptions = {
  keepPhysical = false;
  keepMental = false;
  keepSaves = false;
  keepSkills = false;
  mergeSaves = false;
  mergeSkills = false;
  keepClass = false;
  keepFeats = false;
  keepSpells = false;
  keepItems = false;
  keepBio = false;
  keepVision = false;
  keepSelf = false;
  keepAE = false;
  keepAEOnlyOriginNotEquipment = false;
  transformTokens = true;
  explicitName = '';
}
```

These settings should customized

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://raw.githubusercontent.com/p4535992/foundryvtt-automated-polymorpher/master/src/module.json`
4.  Click 'Install' and wait for installation to complete
5.  Don't forget to enable the module in game using the "Manage Module" button

### sequencer

This module uses the [sequencer](https://github.com/fantasycalendar/FoundryVTT-Sequencer/) library. It is a hard dependency.

### warpgate

This module uses the [warpgate](https://github.com/trioderegion/warpgate) library. It is a mandatory dependency and it is recommended for the best experience and compatibility with other modules.

### socketlib

This module uses the [socketlib](https://github.com/manuelVo/foundryvtt-socketlib) library for wrapping core methods. It is a hard dependency and it is recommended for the best experience and compatibility with other modules.

### advanced-macros (optional)

This module uses the [advanced-macros](https://github.com/League-of-Foundry-Developers/fvtt-advanced-macros) library. It is a optional dependency and it is recommended for the best experience and compatibility with other modules.

**NOTE: you need this only for the custom macro feature, i don't suggest it is much easier to create the actors and set them up, with the drag and drop but it's up to you**

## Features

## Integration wit 'Warpgate'

When the module setting  'Force use of Warpgate' is enabled , we tried to se the warpgate module for mutate the actor.
You must understand the things:

- Warpgate is a high level module and can be cusomized in many way
- Warpgate let you mutate the token without the need to create a temporary actor like in the standard behaviour

## Token configuration panel

![gif](./wiki/feature_automated_polymorhper.gif)

Open any character sheet, in the header of the window you will see the polymorphers button

![image](./wiki/Image1.png)

Upon opening you will be welcomed by a window, from here you can drag and drop actor into it to add them.

After adding actor to the window you will have some options:

- To mutate click on the actor image
- The dropdown will let you chose the summoning animation

![image](./wiki/Image2.png)

Then you interact with the standard panel of the Polymorph (if the system is dnd5e)

![image](./wiki/Image3.png)

## Token HUD fast click

An interface in the hud layer now allows you to speed up the transformations during a fight in a very intuitive way to manage the transformations there are three modes, at the level of the individual actor:

- Random: the next transformation is randomly taken from the list of transformations associated with the actor
- Ordered: the next transformation is taken according to the order of the list of transformations associated with the actor
- No random, No orderder: the standard method shows the configuration panel that you would have by clicking on the header sheet button

the actions on the hud button are of two types left click and right click.

- Left click activates the transformation event
- Right click reverts the transformation and returns to the original shape.

![hud](./wiki/feature_hud_1.gif)

**NOTE: you can't have both ordered and random**
**NOTE: Remember you must own the token for see the HUD button**

# API

###  async game.modules.get('automated-polymorpher').api.invokePolymorpherManager(sourceTokenIdOrName: string, removePolymorpher = false, ordered = false, random = false, animationExternal:{ sequence:Sequence, timeToWait:number }|undefined = undefined) ⇒ <code>Promise.&lt;void&gt;</code>

Invoke the polymorpher manager feature from macro

**Returns**: <code>Promise.&lt;void&gt;</code> - A empty promise

| Param | Type | Description | Default |
| --- | --- | --- | --- |
| sourceTokenIdOrName | <code>string</code> | The id or the name of the token (not the actor) | <code>undefined</code> |
| removePolymorpher | <code>boolean</code> | This action should revert the polymorpher if the current token is polymorphed | <code>false</code> |
| ordered | <code>boolean</code> | The 'ordered' feature is enabled for this polymorphing | <code>false</code> |
| random | <code>boolean</code> | The 'random' feature is enabled for this polymorphing | <code>0</code> |
| explicitName | <code>string</code> | The explicit name to assign to the target actor | <code></code> |
| animationExternal | <code>{ sequence:Sequence, timeToWait:number }</code> | Advanced: Use your personal sequence animation and the time needed to wait before the polymorph action, checkout the [Sequencer module](https://github.com/fantasycalendar/FoundryVTT-Sequencer) for more information  | <code>undefined</code> |

**NOTE:** If both 'random' and 'ordered' are false the standard dialog will be rendered.

**Examples**:

`game.modules.get('automated-polymorpher').api.invokePolymorpherManager('Zruggig Widebrain')`

`game.modules.get('automated-polymorpher').api.invokePolymorpherManager('Zruggig Widebrain', true)`

`game.modules.get('automated-polymorpher').api.invokePolymorpherManager('Zruggig Widebrain', false, false)`

`game.modules.get('automated-polymorpher').api.invokePolymorpherManager('Zruggig Widebrain', false, false, false)`

```
let sequence = new Sequence()
    .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/electrivity_blast_CIRCLE.webm")
        .atLocation(tokenD)
        .scale(0.35)
    .wait(1000)
        .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/lightning_bolt_RECTANGLE_05.webm")
        .atLocation(tokenD)
        .reachTowards({
            x: tokenD.center.x + canvas.grid.size*5,
            y: tokenD.center.y
        })
    .wait(100)
    .animation()
        .on(tokenD)
        .teleportTo({
            x: tokenD.x + canvas.grid.size*5,
            y: tokenD.y
        })
        .waitUntilFinished()
    .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/electric_ball_CIRCLE_06.webm")
        .atLocation(tokenD)
        .scale(0.5)

game.modules.get('automated-polymorpher').api.invokePolymorpherManager('Zruggig Widebrain', false, false, false, { sequence: sequence, timeToWait 1100})
```

###  async game.modules.get('automated-polymorpher').api.invokePolymorpherManagerFromActor(sourceActorIdOrName: string, removePolymorpher = false, ordered = false, random = false, animationExternal:{ sequence:Sequence, timeToWait:number }|undefined = undefined) ⇒ <code>Promise.&lt;void&gt;</code>

Invoke the polymorpher manager feature from macro

**Returns**: <code>Promise.&lt;void&gt;</code> - A empty promise

| Param | Type | Description | Default |
| --- | --- | --- | --- |
| sourceActorIdOrName | <code>string</code> | The id or the name of the actor (not the token) | <code>undefined</code> |
| removePolymorpher | <code>boolean</code> | This action should revert the polymorpher if the current token is polymorphed | <code>false</code> |
| ordered | <code>boolean</code> | The 'ordered' feature is enabled for this polymorphing | <code>false</code> |
| random | <code>boolean</code> | The 'random' feature is enabled for this polymorphing | <code>0</code> |
| explicitName | <code>string</code> | The explicit name to assign to the target actor | <code></code> |
| animationExternal | <code>{ sequence:Sequence, timeToWait:number }</code> | Advanced: Use your personal sequence animation and the time needed to wait before the polymorph action, checkout the [Sequencer module](https://github.com/fantasycalendar/FoundryVTT-Sequencer) for more information  | <code>undefined</code> |

**NOTE:** If both 'random' and 'ordered' are false the standard dialog will be rendered.

**Examples**:

`game.modules.get('automated-polymorpher').api.invokePolymorpherManagerFromActor('Zruggig Widebrain')`

`game.modules.get('automated-polymorpher').api.invokePolymorpherManagerFromActor('Zruggig Widebrain', true)`

`game.modules.get('automated-polymorpher').api.invokePolymorpherManagerFromActor('Zruggig Widebrain', false, false)`

`game.modules.get('automated-polymorpher').api.invokePolymorpherManagerFromActor('Zruggig Widebrain', false, false, false)`

```
let sequence = new Sequence()
    .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/electrivity_blast_CIRCLE.webm")
        .atLocation(tokenD)
        .scale(0.35)
    .wait(1000)
        .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/lightning_bolt_RECTANGLE_05.webm")
        .atLocation(tokenD)
        .reachTowards({
            x: tokenD.center.x + canvas.grid.size*5,
            y: tokenD.center.y
        })
    .wait(100)
    .animation()
        .on(tokenD)
        .teleportTo({
            x: tokenD.x + canvas.grid.size*5,
            y: tokenD.y
        })
        .waitUntilFinished()
    .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/electric_ball_CIRCLE_06.webm")
        .atLocation(tokenD)
        .scale(0.5)

game.modules.get('automated-polymorpher').api.invokePolymorpherManagerFromActor('Zruggig Widebrain', false, false, false, { sequence: sequence, timeToWait 1100})
```

### Macro to clean up flags on token and actor

####  async game.modules.get('automated-polymorpher').api.cleanUpTokenSelected() ⇒ <code>Promise.&lt;void&gt;</code>

**Examples**:

`game.modules.get('automated-polymorpher').api.cleanUpTokenSelected()`

## Integration with socketLib


```
let sequence = new Sequence()
    .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/electrivity_blast_CIRCLE.webm")
        .atLocation(tokenD)
        .scale(0.35)
    .wait(1000)
        .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/lightning_bolt_RECTANGLE_05.webm")
        .atLocation(tokenD)
        .reachTowards({
            x: tokenD.center.x + canvas.grid.size*5,
            y: tokenD.center.y
        })
    .wait(100)
    .animation()
        .on(tokenD)
        .teleportTo({
            x: tokenD.x + canvas.grid.size*5,
            y: tokenD.y
        })
        .waitUntilFinished()
    .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/electricity/electric_ball_CIRCLE_06.webm")
        .atLocation(tokenD)
        .scale(0.5)

game.modules.get('automated-polymorpher').socket.executeAsGM('invokePolymorpherManager',['Zruggig Widebrain', false, false, false, { sequence: sequence, timeToWait 1100}]);
```

# Build

## Install all packages

```bash
npm install
```

### dev

`dev` will let you develop you own code with hot reloading on the browser

```bash
npm run dev
```

## npm build scripts

### build

`build` will build and set up a symlink between `dist` and your `dataPath`.

```bash
npm run build
```

### build-watch

`build-watch` will build and watch for changes, rebuilding automatically.

```bash
npm run build-watch
```

### prettier-format

`prettier-format` launch the prettier plugin based on the configuration [here](./.prettierrc)

```bash
npm run-script prettier-format
```

## [Changelog](./changelog.md)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/p4535992/foundryvtt-automated-polymorpher/issues ), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## License

- **Jack Kerouac's**: [GPL-3.0 License](https://github.com/jackkerouac/animated-tokens/blob/main/LICENSE)

- **JB2A**: [CC BY-NC-SA 4.0](https://github.com/Jules-Bens-Aa/JB2A_DnD5e/blob/main/License.txt)

- **Sequencer**: [Mit License](https://github.com/fantasycalendar/FoundryVTT-Sequencer/blob/master/LICENSE)

- **Warpgate**: [GPL-3.0 License](https://github.com/trioderegion/warpgate/blob/master/LICENSE)

- **Automated Evocations**: ???

- **Game Icons**: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

This package is under an [GPL-3.0 License](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).

## Credits

- **Jack Kerouac's**: The Fire, Air, Lightning, Water, Energy, Magic, Heart, Crescendo, Four Elements animations assets are from Jack Kerouac's amazing https://github.com/jackkerouac/animated-spell-effects-cartoon module. (used with permission)

- **JB2A**: The  Chord, Darkness, Ice, Conjuration, Storm animations assets are courtesy of JB2A (Free animated assets), i strongly reccomend checking out their patreon for many more amazing animations and variations. (used with permission) https://discord.gg/A59GAZwB9M https://www.patreon.com/JB2A

- **Sequencer**: This module is used to play the animations https://github.com/fantasycalendar/FoundryVTT-Sequencer

- **Warpgate**: This module is used for the spawning https://github.com/trioderegion/warpgate

- **Automated Evocations**: This module is used for the inspiration and base functionality https://github.com/theripper93/automated-evocations

- **Game Icons**: Some images used are from https://game-icons.net/

## Acknowledgements

Bootstrapped with League of Extraordinary FoundryVTT Developers  [foundry-vtt-types](https://github.com/League-of-Foundry-Developers/foundry-vtt-types).

Mad props to the 'League of Extraordinary FoundryVTT Developers' community which helped me figure out a lot.
