const isRuntimeAddon = require('../../../lib/utils/is-runtime-addon');
const FixturifyProject = require('../../helpers/fixturify-project');
const expect = require('chai').expect;

describe('isRuntimeAddon', function() {
  it('returns true for addons if they have a non-empty `app` or `addon` directory', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3', a => {
      a.files['app'] = {
        'index.html': ''
      };
    });
    fixturifyProject.addAddon('bar', '1.2.3', a => {
      a.files['addon'] = {
        'components': {
          'bar.js': ''
        }
      };
    });
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    for (const addon of project.addons) {
      expect(isRuntimeAddon(addon)).to.be.true;
    }
  });

  it('returns false for addons that have unused `app` and `addon` directories', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3', a => {
      a.files['app'] = {
        '.gitignore': ''
      };
    });
    fixturifyProject.addAddon('bar', '1.2.3');
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    for (const addon of project.addons) {
      expect(isRuntimeAddon(addon)).to.be.false;
    }
  });
});
