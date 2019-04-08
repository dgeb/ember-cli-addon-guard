import readConfig from './lib/utils/read-config';
import reviewProject from './lib/utils/review-project';
import dependentsToString from './lib/utils/dependents-to-string';
// import SilentError from 'silent-error';

export default {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    this.addonGuardConfig = readConfig(this.project);
  },

  preBuild() {
    const config = this.addonGuardConfig;
    const options = {
      ignoreAddons: config.ignoreAddons || [],
      runtimeOnly: true,
      conflictsOnly: true
    };
    const conflicts = reviewProject(this.project, options);
    const conflictCount = Object.keys(conflicts).length;

    if (conflictCount > 0) {
      // TODO: clean up formatting of this message
      let description = `\nATTENTION: ember-cli-addon-guard has prevented your application from building!\n\n`;
      description += `Your application is dependent on multiple versions of the following run-time addon(s):\n`;

      for (const addon in conflicts) {
        description += `\n${addon}\n----------------------------------------\n`;
        description += dependentsToString(addon, conflicts[addon]);
      }

      throw new Error(description);
    }
  },

  includedCommands() {
    return {
      'addon-guard': require('./lib/commands/addon-guard'),
    };
  }
};
