'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Checks if an addon has non-empty `app` or `addon` trees to determine if it
 * is a "runtime addon", and thus worth tracking.
 *
 * Note that dot-files (e.g. `.gitignore`) will be ignored when scanning files
 * in these directories.
 */
module.exports = function isRuntimeAddon(addon) {
  for (const treeName of ['app', 'addon']) {
    const treePath = path.join(addon.root, addon.treePaths[treeName] || treeName);
    if (isPathUsed(treePath)) {
      return true;
    }
  }

  return false;
};

function isPathUsed(path) {
  if (fs.existsSync(path)) {
    let files = fs.readdirSync(path);
    for (let file of files) {
      if (file.indexOf('.') !== 0) {
        return true;
      }
    }
  }
}
