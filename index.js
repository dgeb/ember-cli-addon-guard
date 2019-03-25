'use strict';

const readConfig = require('./lib/utils/read-config');
const reviewProject = require('./lib/utils/review-project');
const dependentsToString = require('./lib/utils/dependents-to-string');
const SilentError = require('silent-error');

module.exports = {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    this.addonGuardConfig = readConfig(this.project);
  },

  preBuild() {
    // see https://ember-cli.com/api/classes/Addon.html#method_preBuild

    const conflicts = reviewProject(this.project, this.addonGuardConfig);
    const conflictCount = Object.keys(conflicts).length;

    if (conflictCount > 0) {
      // TODO: clean up formatting of this message
      let description = `\nATTENTION: ember-cli-addon-guard has prevented your application from building!\n\n`;
      description += `Your application is dependent on multiple versions of the following run-time addon(s):\n`;

      for (const addon in conflicts) {
        description += `\n${addon}\n----------------------------------------\n`;
        description += dependentsToString(addon, conflicts[addon]);
      }

      throw new SilentError(description);
    }
  },

  includedCommands() {
    return {
      'addon-guard': require('./lib/commands/addon-guard'),
    };
  }
};
