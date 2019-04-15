import chalk from 'chalk';
import readConfig from './lib/utils/read-config';
import reviewProject, { ReviewProjectOptions } from './lib/utils/review-project';
import dependentsToString from './lib/utils/dependents-to-string';
import { AddonGuardConfig, AddonVersionSummary, Dict } from './lib/interfaces';
import SilentError from 'silent-error';

module.exports = {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    this.addonGuardConfig = readConfig(this.project);
  },

  preBuild() {
    const config: AddonGuardConfig = this.addonGuardConfig;

    if (config.skipBuildChecks) {
      this.ui.writeLine(chalk.yellow('WARNING: ember-cli-addon-guard is configured to skip all checks during builds. To override this, set `skipBuildChecks: false` in `config/addon-guard.js`.'));
      return;
    }

    const options: ReviewProjectOptions = {
      ignoreAddons: config.ignoreAddons || [],
      runtimeOnly: true,
      conflictsOnly: true,
      skipCacheKeyDependencyChecks: config.skipCacheKeyDependencyChecks
    };
    const summary = reviewProject(this.project, options);
    const addons = summary.addons;
    const conflictCount = Object.keys(addons).length;

    if (summary.errors.length > 0 || conflictCount > 0) {
      // TODO: clean up formatting of this message
      let description = `\nATTENTION: ember-cli-addon-guard has prevented your application from building!\n\n`;

      description += `Please correct the following errors:\n\n`;

      if (summary.errors.length > 0) {
        description += summary.errors.join('\n\n') + '\n\n';
      }

      if (conflictCount > 0) {
        description += `Your application is dependent on multiple versions of the following run-time ${ conflictCount > 1 ? 'addons' : 'addon'}:\n`;

        for (const name in addons) {
          const addonSummaries: Dict<AddonVersionSummary> = addons[name];
          description += `\n${name}\n----------------------------------------\n`;
          description += dependentsToString(name, addonSummaries);
        }
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
