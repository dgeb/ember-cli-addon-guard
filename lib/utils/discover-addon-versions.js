'use strict';

const isRuntimeAddon = require('./is-runtime-addon');

/**
 * Given a Project instance, traverses the addon inclusion tree to discover all
 * included versions of all addons in the build, producing a structure in the
 * format:
 *
 *  {
 *    "addon-name": {
 *      "addon.version": [
 *        ["project", "immediate-dependent"],
 *        ["project", "path-to", "nested-dependent"]
 *      ]
 *    }
 *  }
 *
 *  Possible options:
 *  - ignoreAddons - an array of addon names to ignore
 *  - runtimeOnly - only return runtime addons should be returned
 *  - conflictsOnly - only return addons with > 1 version
 */
module.exports = function discoverAddonVersions(project, options) {
  options = options || {};
  options.ignoreAddons = IGNORED_ADDONS.concat(options.ignoreAddons || []);

  const versions = Object.create(null);
  traverseAddonVersions([project.name()], project.addons, versions, options);

  if (options.conflictsOnly) {
    for (const addon in versions) {
      if (Object.keys(versions[addon]).length < 2) {
        delete versions[addon];
      }
    }
  }

  return versions;
};

function traverseAddonVersions(parentPath, addons, versions, options) {
  for (const addon of addons) {
    // In-repo addons may have no version, but they're tied to their parent so that's okay
    if (addon.pkg.version &&
        !options.ignoreAddons.includes(addon.pkg.name) &&
        (!options.runtimeOnly || isRuntimeAddon(addon))) {

      const addonDependents = versions[addon.pkg.name] || (versions[addon.pkg.name] = Object.create(null));
      const versionDependents = addonDependents[addon.pkg.version] || (addonDependents[addon.pkg.version] = []);

      versionDependents.push(parentPath);
    }

    traverseAddonVersions(parentPath.concat(addon.pkg.name), addon.addons || [], versions, options);
  }
}

const IGNORED_ADDONS = [
  'ember-cli-htmlbars',
  'ember-cli-babel',
  'ember-cli-sass',
  'ember-cli-node-assets',
  'ember-cli-htmlbars-inline-precompile',
  'ember-auto-import',
  'ember-cli-typescript'
];
