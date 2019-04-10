import chalk from 'chalk';
import readConfig from '../utils/read-config';
import reviewProject, { ReviewProjectOptions } from '../utils/review-project';
import dependentsToString from '../utils/dependents-to-string';
import { AddonSummary, Dict } from '../interfaces';

module.exports = {
  name: 'addon-guard',
  description: 'Review project to ensure that no addon dependency conflicts are present.',
  works: 'insideProject',

  // TODO - add options?
  // availableOptions: Object.freeze([]),

  run(/* options: any */) {
    const config = readConfig(this.project);
    const options: ReviewProjectOptions = {
      ignoreAddons: config.ignoreAddons || [],
      runtimeOnly: true,
      conflictsOnly: true,
      skipCacheKeyDependencyChecks: config.skipCacheKeyDependencyChecks
    };
    const summary = reviewProject(this.project, options);
    const addons = summary.addons;
    const addonCount = Object.keys(addons).length;

    if (addonCount > 0) {
      this.ui.writeLine(chalk.white(`${addonCount} addons identified by ember-cli-addon-guard:\n`));

      for (const name in addons) {
        const addonInstances: Dict<AddonSummary> = addons[name];
        this.ui.writeLine(chalk.underline(`${name}`));
        this.ui.writeLine(dependentsToString(name, addonInstances));
      }
    } else {
      this.ui.writeLine(chalk.green(`No matching addons were found by ember-cli-addon-guard.`));
    }
  }
};
