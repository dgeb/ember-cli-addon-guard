import chalk from 'chalk';
import readConfig from '../utils/read-config';
import reviewProject from '../utils/review-project';
import dependentsToString from '../utils/dependents-to-string';
import { AddonVersionSummary, Dict } from '../interfaces';

module.exports = {
  name: 'addon-guard',
  description: 'Review project to ensure that no addon dependency conflicts are present.',
  works: 'insideProject',

  availableOptions: Object.freeze([
    {
      name: 'all',
      type: Boolean,
      default: false,
      description: 'whether to include all addons, including those without run-time conflicts',
    }
  ]),

  run(options: any) {
    const config = readConfig(this.project);
    const summary = reviewProject(this.project, {
      ignoreAddons: config.ignoreAddons || [],
      runtimeOnly: !options.all,
      conflictsOnly: !options.all,
      skipCacheKeyDependencyChecks: config.skipCacheKeyDependencyChecks
    });
    const addons = summary.addons;
    const addonCount = Object.keys(addons).length;
    let duplicateAddons = {};

    if (options.all) {
      if (addonCount > 0) {
        this.ui.writeLine(chalk.white(`ember-cli-addon-guard identified ${addonCount} addons:\n`));

        for (const name in addons) {
          const addonInstances: Dict<AddonVersionSummary> = addons[name];
          this.ui.writeLine(chalk.underline(`${name}`));
          this.ui.writeLine(dependentsToString(name, addonInstances));
          if (Object.keys(addonInstances).length > 1) {
            duplicateAddons[name] = addonInstances;
          }
        }
      } else {
        this.ui.writeLine(chalk.green(`ember-cli-addon-guard could not identify any addons.`));
      }
    } else if (addonCount > 0) {
      duplicateAddons = addons;
    }

    if (Object.keys(duplicateAddons).length > 0 || summary.errors.length > 0) {
      if (Object.keys(duplicateAddons).length > 0) {
        this.ui.writeLine(chalk.red(chalk.underline('Summary')));
        this.ui.writeLine(chalk.red(`Number of addons with multiple verions: ${ addonCount }\n`));
        for (const name in duplicateAddons) {
          const addonInstances: Dict<AddonVersionSummary> = duplicateAddons[name];
          const versions = new Set();
          for (const cacheKey of Object.keys(addonInstances)) {
            const instance = addonInstances[cacheKey];
            versions.add(instance.version);
          }
          this.ui.writeLine(chalk.red(`${name}: [${Array.from(versions.values()).join(' , ')}]`));
        }

        this.ui.writeLine(chalk.red(chalk.underline('\nDetails')));
        this.ui.writeLine(chalk.red(`ember-cli-addon-guard determined that your application is dependent on multiple versions of the following run-time ${ addonCount > 1 ? 'addons' : 'addon'}:\n`));

        for (const name in duplicateAddons) {
          const addonInstances: Dict<AddonVersionSummary> = duplicateAddons[name];
          this.ui.writeLine(chalk.red(chalk.underline(`${name}`)));
          this.ui.writeLine(chalk.red(dependentsToString(name, addonInstances)));
        }
      }

      if (summary.errors.length > 0) {
        this.ui.writeLine(chalk.red(`ember-cli-addon-guard has identified the following errors:\n`));
        for (const error of summary.errors) {
          this.ui.writeLine(chalk.red(error) + '\n');
        }
      }
    } else {
      this.ui.writeLine(chalk.green(`ember-cli-addon-guard found no problems with your project.`));
    }
  }
};
