const discoverAddonVersions = require('../../../lib/utils/discover-addon-versions');
const FixturifyProject = require('../../helpers/fixturify-project');
const expect = require('chai').expect;

describe('discoverRuntimeAddonVersions', function() {
  it('emits the versions at the root', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3');
    fixturifyProject.addAddon('bar', '1.0.0');
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    expect(discoverAddonVersions(project)).to.deep.equal({
      foo: {
        '1.2.3': [['root']],
      },
      bar: {
        '1.0.0': [['root']],
      },
    });
  });

  it('emits nested versions', function() {
    const fixturifyProject = new FixturifyProject('root', '0.0.0');
    fixturifyProject.addDevDependency('ember-cli', '*');
    fixturifyProject.addAddon('foo', '1.2.3');
    fixturifyProject.addAddon('bar', '1.0.0', a => {
      a.addAddon('baz', '5.0.1');
    });
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    expect(discoverAddonVersions(project)).to.deep.equal({
      foo: {
        '1.2.3': [['root']],
      },
      bar: {
        '1.0.0': [['root']],
      },
      baz: {
        '5.0.1': [['root', 'bar']],
      },
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
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    expect(discoverAddonVersions(project)).to.deep.equal({
      foo: {
        '1.2.3': [['root', 'bar', 'baz'], ['root', 'bar'], ['root']],
      },
      bar: {
        '1.0.0': [['root']],
      },
      baz: {
        '5.0.1': [['root', 'bar']],
      },
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
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    expect(discoverAddonVersions(project)).to.deep.equal({
      foo: {
        '2.0.1': [['root']],
        '1.2.5': [['root', 'bar']],
        '1.2.3': [['root', 'bar', 'baz']],
      },
      bar: {
        '1.0.0': [['root']],
      },
      baz: {
        '5.0.1': [['root', 'bar']],
      },
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
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    expect(discoverAddonVersions(project, { runtimeOnly: true })).to.deep.equal({
      bar: {
        '1.0.0': [['root']],
      },
      baz: {
        '5.0.1': [['root', 'bar']],
      },
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
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    expect(discoverAddonVersions(project, { ignoreAddons: ['foo', 'bar']})).to.deep.equal({
      baz: {
        '5.0.1': [['root', 'bar']],
      },
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
    fixturifyProject.writeSync();

    const project = fixturifyProject.buildProjectModel();
    project.initializeAddons();

    expect(discoverAddonVersions(project, { conflictsOnly: true })).to.deep.equal({
      foo: {
        '2.0.1': [['root']],
        '1.2.5': [['root', 'bar']],
        '1.2.3': [['root', 'bar', 'baz']],
      }
    });
  });
});
