import chalk from 'chalk';
import readConfig from './lib/utils/read-config';
import reviewProject, { ReviewProjectOptions } from './lib/utils/review-project';
import dependentsToString from './lib/utils/dependents-to-string';
import namespaceAddon from './lib/utils/namespace-addon';
import { AddonGuardConfig, AddonVersionSummary, Dict } from './lib/interfaces';
import SilentError from 'silent-error';

module.exports = {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    this.addonGuardConfig = readConfig(this.project);
  },

  included() {
    this._super.included && this._super.included.apply(this, arguments);

    const config: AddonGuardConfig = this.addonGuardConfig;

    if (config.skipBuildChecks) {
      this.ui.writeLine(chalk.yellow('WARNING: ember-cli-addon-guard is configured to skip all checks during builds. To override this, set `skipBuildChecks: false` in `config/addon-guard.js`.'));
      return;
    }

    // TODO: { browser-runtime: true }

    const namespaceAddons = config.namespaceAddons || [];
    const ignoreAddons = config.ignoreAddons || [];
    const options: ReviewProjectOptions = {
      ignoreAddons,
      namespaceAddons,
      runtimeOnly: true,
      conflictsOnly: true,
      skipCacheKeyDependencyChecks: config.skipCacheKeyDependencyChecks
    };
    const summary = reviewProject(this.project, options);
    const addons = summary.addons;
    const addonNames = Object.keys(addons);

    // Namespace addons if possible (i.e. if there are no other errors or conflicts)
    if (summary.errors.length === 0 && addonNames.length > 0 && namespaceAddons.length > 0) {
      const namesOfAddonsToNamespace = addonNames.filter(name => namespaceAddons.includes(name));
      if (namesOfAddonsToNamespace.length === addonNames.length) {
        this.ui.writeLine(chalk.yellow(`ATTENTION: ember-cli-addon-guard will namespace the following addons: ${namesOfAddonsToNamespace.join(', ')}`));

        for (let name of namesOfAddonsToNamespace) {
          const addonSummaries: Dict<AddonVersionSummary> = addons[name];
          const keys = Object.keys(addonSummaries);
          this.ui.writeLine(chalk.yellow(`\n${name} has ${keys.length} different versions.`));

          for (let key in addonSummaries) {
            let addonSummary = addonSummaries[key];
            this.ui.writeLine(chalk.yellow(`${addonSummary.version} (${key}) - ${addonSummary.instances.length} different instances.`));
            namespaceAddon(addonSummary);
          }
        }

        return;
      }
    }

    if (summary.errors.length > 0 || addonNames.length > 0) {
      // TODO: clean up formatting of this message
      let description = `\nATTENTION: ember-cli-addon-guard has prevented your application from building!\n\n`;

      description += `Please correct the following errors:\n\n`;

      if (summary.errors.length > 0) {
        description += summary.errors.join('\n\n') + '\n\n';
      }

      if (addonNames.length > 0) {
        description += `Your application is dependent on multiple versions of the following run-time ${ addonNames.length > 1 ? 'addons' : 'addon'}:\n`;

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
