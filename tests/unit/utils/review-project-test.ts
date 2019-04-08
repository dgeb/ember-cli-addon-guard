import reviewProject from '../../../lib/utils/review-project';
import FixturifyProject from '../../helpers/fixturify-project';
import { expect } from 'chai';

describe('reviewProject', function() {
  it('emits the versions at the root', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3');
    fixturifyProject.addAddon('bar', '1.0.0');
    const project = fixturifyProject.buildProjectModel();

    expect(reviewProject(project)).to.deep.equal({
      foo: {
        'foo:1.2.3': {
          version: '1.2.3',
          cacheKey: 'foo:1.2.3',
          dependents: [['root']]
        }
      },
      bar: {
        'bar:1.0.0': {
          version: '1.0.0',
          cacheKey: 'bar:1.0.0',
          dependents: [['root']]
        }
      }
    });
  });

  it('emits nested versions', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3');
    fixturifyProject.addAddon('bar', '1.0.0', a => {
      a.addAddon('baz', '5.0.1');
    });
    const project = fixturifyProject.buildProjectModel();

    expect(reviewProject(project)).to.deep.equal({
      foo: {
        'foo:1.2.3': {
          version: '1.2.3',
          cacheKey: 'foo:1.2.3',
          dependents: [['root']]
        }
      },
      bar: {
        'bar:1.0.0': {
          version: '1.0.0',
          cacheKey: 'bar:1.0.0',
          dependents: [['root']]
        }
      },
      baz: {
        'baz:5.0.1': {
          version: '5.0.1',
          cacheKey: 'baz:5.0.1',
          dependents: [['root', 'bar']]
        }
      }
    });
  });

  it('coalesces same versions found in different locations', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3');
    fixturifyProject.addAddon('bar', '1.0.0', a => {
      a.addAddon('foo', '1.2.3');
      a.addAddon('baz', '5.0.1', a => {
        a.addAddon('foo', '1.2.3');
      });
    });
    const project = fixturifyProject.buildProjectModel();

    expect(reviewProject(project)).to.deep.equal({
      foo: {
        'foo:1.2.3': {
          version: '1.2.3',
          cacheKey: 'foo:1.2.3',
          dependents: [
            ['root', 'bar', 'baz'],
            ['root', 'bar'],
            ['root']
          ]
        }
      },
      bar: {
        'bar:1.0.0': {
          version: '1.0.0',
          cacheKey: 'bar:1.0.0',
          dependents: [['root']]
        }
      },
      baz: {
        'baz:5.0.1': {
          version: '5.0.1',
          cacheKey: 'baz:5.0.1',
          dependents: [['root', 'bar']]
        }
      }
    });
  });

  it('records different versions found in different locations', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '2.0.1');
    fixturifyProject.addAddon('bar', '1.0.0', a => {
      a.addAddon('foo', '1.2.5');
      a.addAddon('baz', '5.0.1', a => {
        a.addAddon('foo', '1.2.3');
      });
    });
    const project = fixturifyProject.buildProjectModel();

    expect(reviewProject(project)).to.deep.equal({
      foo: {
        'foo:1.2.3': {
          version: '1.2.3',
          cacheKey: 'foo:1.2.3',
          dependents: [['root', 'bar', 'baz']]
        },
        'foo:1.2.5': {
          version: '1.2.5',
          cacheKey: 'foo:1.2.5',
          dependents: [['root', 'bar']]
        },
        'foo:2.0.1': {
          version: '2.0.1',
          cacheKey: 'foo:2.0.1',
          dependents: [['root']]
        }
      },
      bar: {
        'bar:1.0.0': {
          version: '1.0.0',
          cacheKey: 'bar:1.0.0',
          dependents: [['root']]
        }
      },
      baz: {
        'baz:5.0.1': {
          version: '5.0.1',
          cacheKey: 'baz:5.0.1',
          dependents: [['root', 'bar']]
        }
      }
    });
  });

  it('can return runtime-only addons', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '2.0.1');
    fixturifyProject.addAddon('bar', '1.0.0', a => {
      a.files['app'] = {
        'index.html': ''
      };
      a.addAddon('foo', '1.2.5');
      a.addAddon('baz', '5.0.1', a => {
        a.files['app'] = {
          'index.html': ''
        };
        a.addAddon('foo', '1.2.3');
      });
    });
    const project = fixturifyProject.buildProjectModel();

    expect(reviewProject(project, { runtimeOnly: true })).to.deep.equal({
      bar: {
        'bar:1.0.0': {
          version: '1.0.0',
          cacheKey: 'bar:1.0.0',
          dependents: [['root']]
        }
      },
      baz: {
        'baz:5.0.1': {
          version: '5.0.1',
          cacheKey: 'baz:5.0.1',
          dependents: [['root', 'bar']]
        }
      }
    });
  });

  it('can ignore specific addons', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '2.0.1');
    fixturifyProject.addAddon('bar', '1.0.0', a => {
      a.addAddon('foo', '1.2.5');
      a.addAddon('baz', '5.0.1', a => {
        a.addAddon('foo', '1.2.3');
      });
    });
    const project = fixturifyProject.buildProjectModel();

    expect(reviewProject(project, { ignoreAddons: ['foo', 'bar']})).to.deep.equal({
      baz: {
        'baz:5.0.1': {
          version: '5.0.1',
          cacheKey: 'baz:5.0.1',
          dependents: [['root', 'bar']]
        }
      }
    });
  });

  it('can return only addons with conflicting versions', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '2.0.1');
    fixturifyProject.addAddon('bar', '1.0.0', a => {
      a.addAddon('foo', '1.2.5');
      a.addAddon('baz', '5.0.1', a => {
        a.addAddon('foo', '1.2.3');
      });
    });
    const project = fixturifyProject.buildProjectModel();

    expect(reviewProject(project, { conflictsOnly: true })).to.deep.equal({
      foo: {
        'foo:1.2.3': {
          version: '1.2.3',
          cacheKey: 'foo:1.2.3',
          dependents: [['root', 'bar', 'baz']]
        },
        'foo:1.2.5': {
          version: '1.2.5',
          cacheKey: 'foo:1.2.5',
          dependents: [['root', 'bar']]
        },
        'foo:2.0.1': {
          version: '2.0.1',
          cacheKey: 'foo:2.0.1',
          dependents: [['root']]
        }
      }
    });
  });
});
