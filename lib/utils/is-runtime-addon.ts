import path from 'path';
import fs from 'fs';

/**
 * Checks if an addon has non-empty `app` or `addon` trees to determine if it
 * is a "runtime addon", and thus worth tracking.
 *
 * Note that dot-files (e.g. `.gitignore`) will be ignored when scanning files
 * in these directories.
 */
export default function isRuntimeAddon(addon: any): boolean {
  for (const treeName of ['app', 'addon']) {
    const treePath = path.join(addon.root, (addon.treePaths && addon.treePaths[treeName]) || treeName);
    if (isPathUsed(treePath)) {
      return true;
    }
  }

  return false;
}

function isPathUsed(path: string): boolean {
  if (fs.existsSync(path)) {
    let files = fs.readdirSync(path);
    for (let file of files) {
      if (file.indexOf('.') !== 0) {
        return true;
      }
    }
  }

  return false;
}
