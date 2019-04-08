import chalk from 'chalk';
import readConfig from '../utils/read-config';
import reviewProject from '../utils/review-project';
import dependentsToString from '../utils/dependents-to-string';

export default {
  name: 'addon-guard',
  description: 'Review project to ensure that no addon dependency conflicts are present.',
  works: 'insideProject',

  // TODO - add options?
  // availableOptions: Object.freeze([]),

  run(/* options: any */) {
    const config = readConfig(this.project);
    const conflicts = reviewProject(this.project, config);
    const conflictCount = Object.keys(conflicts).length;

    if (conflictCount > 0) {
      this.ui.writeLine(chalk.red(`${conflictCount} conflict(s) found by ember-cli-addon-guard:\n`));

      for (const addon in conflicts) {
        this.ui.writeLine(chalk.underline(`${addon}`));
        this.ui.writeLine(dependentsToString(addon, conflicts[addon]));
      }
    } else {
      this.ui.writeLine(chalk.green(`No conflict(s) were found by ember-cli-addon-guard.`));
    }
  }
};
