import isRuntimeAddon from '../../../lib/utils/is-runtime-addon';
import FixturifyProject from '../../helpers/fixturify-project';
import { expect } from 'chai';

describe('isRuntimeAddon', function() {
  it('returns true for addons if they have a non-empty `app` or `addon` directory', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3', (a: any) => {
      a.files['app'] = {
        'index.html': ''
      };
    });
    fixturifyProject.addAddon('bar', '1.2.3', (a: any) => {
      a.files['addon'] = {
        'components': {
          'bar.js': ''
        }
      };
    });
    const project = fixturifyProject.buildProjectModel();

    for (const addon of project.addons) {
      expect(isRuntimeAddon(addon)).to.be.true;
    }
  });

  it('returns false for addons that have unused `app` and `addon` directories', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3', (a: any) => {
      a.files['app'] = {
        '.gitignore': ''
      };
    });
    fixturifyProject.addAddon('bar', '1.2.3');
    const project = fixturifyProject.buildProjectModel();

    for (const addon of project.addons) {
      expect(isRuntimeAddon(addon)).to.be.false;
    }
  });
});
