import path from 'path';
import FixturifyProject from 'fixturify-project';
import Project from 'ember-cli/lib/models/project';
import MockCLI from './mock-cli';

// used in these tests to ensure we are only
// operating on the addons added here
class ProjectWithoutInternalAddons extends Project {
  supportedInternalAddonPaths() {
    return [];
  }
}

function prepareAddon(addon: any) {
  addon.pkg.keywords.push('ember-addon');
  addon.pkg['ember-addon'] = { };
  addon.files['index.js'] = 'module.exports = { name: require("./package").name };';
}

function assignCacheKeyForTreeToAddons(addons: any[]) {
  for (const addon of addons) {
    addon.cacheKeyForTree = function() {
      if (addon.pkg.cacheKey) {
        return addon.pkg.cacheKey;
      } else {
        return `${addon.pkg.name}:${addon.pkg.version}`;
      }
    }
    assignCacheKeyForTreeToAddons(addon.addons);
  }
}

export default class EmberCLIFixturifyProject extends FixturifyProject {
  _hasWritten: boolean;

  writeSync() {
    super.writeSync(...arguments);
    this._hasWritten = true;
  }

  buildProjectModel(ProjectClass: Project = ProjectWithoutInternalAddons) {
    if (this._hasWritten !== false) {
      this.writeSync();
    }

    let pkg = JSON.parse(this.toJSON('package.json') as string);
    let cli = new MockCLI();
    let root = path.join(this.root, this.name);

    let project = new ProjectClass(root, pkg, cli.ui, cli);
    project.initializeAddons();
    assignCacheKeyForTreeToAddons(project.addons);
    return project;
  }

  addAddon(name: string, version = '0.0.0', cb?: (addon: any) => void) {
    return this.addDependency(name, version, addon => {
      prepareAddon(addon);

      if (cb) {
        cb(addon);
      }
    });
  }

  addDevAddon(name: string, version = '0.0.0', cb?: (addon: any) => void) {
    return this.addDevDependency(name, version, addon => {
      prepareAddon(addon);
      if (cb) {
        cb(addon);
      }
    });
  }

  addInRepoAddon(name: string, version = '0.0.0', cb?: (addon: any) => void) {
    const inRepoAddon = new FixturifyProject(name, version, project => {
      project.pkg.keywords.push('ember-addon');
      project.pkg['ember-addon'] = { };
      project.files['index.js'] = 'module.exports = { name: require("./package").name };';

      if (cb) {
        cb(project);
      }
    });

    // configure the current project to have an ember-addon configured at the appropriate path
    let addon = this.pkg['ember-addon'] = this.pkg['ember-addon'] || { };
    addon.paths = addon.paths || [];
    const addonPath = `lib/${name}`;

    if (addon.paths.find((path: string) => path.toLowerCase() === addonPath.toLowerCase())) {
      throw new Error(`project: ${this.name} already contains the in-repo-addon: ${name}`);
    }

    addon.cacheKeyForTree = () => `${name}:${version}`;

    addon.paths.push(addonPath);

    this.files.lib = this.files.lib || {};

    // insert inRepoAddon into files
    Object.assign(this.files.lib, inRepoAddon.toJSON());
  }
};