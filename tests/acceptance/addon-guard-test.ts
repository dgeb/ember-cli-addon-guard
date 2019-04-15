import { AddonTestApp } from 'ember-cli-addon-tests';
import ConsoleUI from 'console-ui';
import { expect } from 'chai';
// import dedent from '../helpers/dedent';

const ui = new ConsoleUI({
  outputStream: process.stdout,
  ci: process.env.CI,
});

describe('Acceptance: CLI', () => {
  let app;

  before(function() {
    this.timeout(300000);

    app = new AddonTestApp();

    ui.startProgress('Creating dummy app...');
    return app.create('test-app', { fixturesPath: 'tests/fixtures' }).then(() => {
      ui.stopProgress();
    });
  });

  describe('valid dependencies', () => {
    beforeEach(() => {
      app.editPackageJSON((pkg) => {
        pkg['ember-addon'] = {
          paths: [
            'lib/addon-v1',
            'lib/requires-v1',
          ],
        };
      });
    });

    it('command exits with zero status and no output', function() {
      this.timeout(10000);

      return app.run('ember', 'addon-guard').then((result) => {
        expect(result.code).to.equal(0);

        const output = result.output.join('');
        expect(output).to.include('ember-cli-addon-guard found no problems with your project.');
      });
    });

    it('command includes all addons when requested', function() {
      this.timeout(10000);

      return app.run('ember', 'addon-guard', '--all').then((result) => {
        expect(result.code).to.equal(0);

        const output = result.output.join('');
        expect(output).to.include('ember-cli-addon-guard identified ');
        expect(output).to.include('ember-cli-addon-guard found no problems with your project.');
      });
    });
  });
});
