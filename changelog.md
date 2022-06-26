### 1.0.34

- ???

### 1.0.33

- [BREAKING CHANGES] Rewrite mostly of the code so do not update just before a session
- Preparation for new customization alghortim for polymorph
- Sadly warpgate seem to have some issue with the mutate function, i'll try to dig the problem for open a issue on the warpgate project, in the meanwhile i'm have tried to replicate the dnd5e polymorph mevchanism for other systems, yuo can still use warpgate by enabling the module setting.
- Add new options "Alter/Disguise self" the custom preset options

### 1.0.32

- Little bug fix on api methods

### 1.0.31

- Bug fix on hud click

### 1.0.30

- NEW FEATURE: Integration for load actors directly from compendium
- NEW FEATURE: Add module settings for enable Warpgate mutate function like a preference, ke sense only on systems with their own polymorph mcheanism like Dnd5e
- NEW FEATURE: Integration for store actors directly on actor instead token on the dialog html
- NEW API: Add api for call polymoprhing with actor reference instead token reference
- Some bug fixing

### 1.0.24

- Add module setting for apply a custom color to the hud button
- Tested with SWADE

### 1.0.23

- Finay fixed the warpgate revert bug (not bug just me being stupid)

### 1.0.22

- Little update hud position feature

### 1.0.21

- Merge de.json file for langugae
- Bug fix: [Doesn't work in v9 latest](https://github.com/p4535992/foundryvtt-automated-polymorpher/issues/5)

### 1.0.20

- Bug fix for case multitoke linked to the same actor, so now the animation is done on the correct token
- Bug fix for apply warpgate mutate function on system not Dnd5e

### 1.0.19

- Bug fix on socketLib

### 1.0.18

- Bug fix on setting labels

### 1.0.17

- Add check for show the hud button only if at least a polymorphing actor is present on the current actor
- Converted the hud settings from 'world' to 'client'
- Set module settings 'hudEnable' default to true

### 1.0.16

- Add hud control
- add some new setting
- Add a fast polymorphing mechanism for make the comabt more fluid
- Add socketLib, API, new feature

### 1.0.15

- add japanese localization, author: のらせす (@BrotherSharper)

### 1.0.14

- Official first release

### 1.0.13

- Remove macro custom management, make this module more basic

### 1.0.12

- Some bug fix
- Update typescript

### 1.0.11

- Some bug fix

### 1.0.10

- Some bug fix

### 1.0.9

- Update typescript

### 1.0.8

- Add [CHANGELOGS & CONFLICTS](https://github.com/theripper93/libChangelogs) hooks for better management of the conflicts
- Colored the header sheet button icon and text
- Add module setting to hide the header button sheet label (active by default)
