# Lab Shell

Shared authoring infrastructure for first-class Lab workspaces.

This directory is the landing zone for code that is not specific to VFX Studio
or World Workshop:

- workspace navigation
- profile and draft storage primitives
- profile actions such as create, rename, duplicate, delete, and lock
- project connection helpers
- generic publish helpers
- generic surface activation
- generic authoring adapter dispatch

Workspace-specific registries, previews, adapters, generators, and publish
targets should stay inside their workspace directory.

## Current Modules

- `lab-profile-store.js` owns generic profile-store creation, load, and persist
  helpers.
- `lab-profile-actions.js` owns generic select-option and custom-profile naming
  helpers.
- `lab-publish.js` owns generic connected-project publish and module-write
  helpers.
- `lab-authoring-adapters.js` owns generic authoring adapter construction and
  capture/apply/default dispatch.
- `lab-workspaces.js` and `lab-workspaces.css` own the shared first-class Lab
  workspace navigation.
