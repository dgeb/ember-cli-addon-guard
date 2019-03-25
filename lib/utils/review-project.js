'use strict';

const discoverAddonVersions = require('./discover-addon-versions');

/**
 * Given a project instance and configuration options, returns a mapping of
 * runtime addons that have conflicting dependency requirements.
 */
module.exports = function reviewProject(project, config) {
  // TODO const toNamespace = [].concat(config.namespaceAddons || []);

  const conflictingAddons = discoverAddonVersions(project, {
    ignoreAddons: config.ignoreAddons || [],
    runtimeOnly: true,
    conflictsOnly: true
  });

  // TODO
  // for (const addon in conflictingAddons) {
  //   if (toNamespace.includes?(addon)) { }
  // }

  return conflictingAddons;
};
