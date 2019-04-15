import isRuntimeAddon from './is-runtime-addon';
import { cacheKeyDependencyVersion, validateCacheKeyDependency } from './validate-cache-key-dependency';
import { ProjectSummary, AddonVersionSummary } from '../interfaces';

export interface ReviewProjectOptions {
  /**
   * An array of addon names to ignore
   */
  ignoreAddons?: string[];

  /**
   * Only return addons with > 1 version?
   */
  conflictsOnly?: boolean;

  /**
   * Only return runtime addons?
   */
  runtimeOnly?: boolean;

  /**
   * By default, any `calculate-cache-key-for-tree` dependencies in use by this
   * project and its addons will be checked to ensure that they're updated.
   *
   * See https://github.com/ember-cli/calculate-cache-key-for-tree/pull/14
   *
   * Pass `true` to skip this check.
   */
  skipCacheKeyDependencyChecks?: boolean;
}

/**
 * Given a Project instance, traverses the addon inclusion tree to discover all
 * included versions of all addons in the build, producing a structure in the
 * format:
 *
 *  {
 *    "addon-name": {
 *      "addon.version": [
 *        ["project", "immediate-dependent"],
 *        ["project", "path-to", "nested-dependent"]
 *      ]
 *    }
 *  }
 */
export default function reviewProject(project: any, options: ReviewProjectOptions = {}): ProjectSummary {
  // TODO const toNamespace = [].concat(config.namespaceAddons || []);
  options.ignoreAddons = IGNORED_ADDONS.concat(options.ignoreAddons || []);

  const addons = {};
  const errors = [];

  const summary: ProjectSummary = { addons, errors };

  traverseAddons([project.name()], project.addons, summary, options);

  if (options.conflictsOnly) {
    for (const name in addons) {
      if (Object.keys(addons[name]).length < 2) {
        delete addons[name];
      }
    }
  }

  if (!options.skipCacheKeyDependencyChecks) {
    const version = cacheKeyDependencyVersion(project.dependencies(), project.root);
    if (version && !validateCacheKeyDependency(version)) {
      summary.errors.push(`This project has a dependency on 'calculate-cache-key-for-tree@${version}'. Update to v1.2.3 or later to avoid unnecessary addon duplication.`);
    }
  }

  return summary;
};

function traverseAddons(parentPath: string[], addons: any, summary: ProjectSummary, options: ReviewProjectOptions) {
  for (const addon of addons) {
    const name = addon.pkg.name;
    const runtime = isRuntimeAddon(addon);

    if (!options.ignoreAddons.includes(name) &&
        (!options.runtimeOnly || runtime)) {

      const version = addon.pkg.version;

      if (version) {
        const cacheKey = (addon.cacheKeyForTree && addon.cacheKeyForTree()) || version;
        const addonSummary = summary.addons[name] || (summary.addons[name] = Object.create(null));
        const keyedSummary: AddonVersionSummary = addonSummary[cacheKey] || (addonSummary[cacheKey] = {
          version,
          cacheKey,
          runtime,
          dependents: []
        });
        keyedSummary.dependents.push(parentPath);
      }

      if (!options.skipCacheKeyDependencyChecks && addon.dependencies) {
        const version = cacheKeyDependencyVersion(addon.dependencies(), addon.root);
        if (version && !validateCacheKeyDependency(version)) {
          summary.errors.push(`The addon '${name}' has a dependency on 'calculate-cache-key-for-tree@${version}'. Update to v1.2.3 or later to avoid unnecessary addon duplication.`);
        }
      }
    }

    if (addon.addons) {
      traverseAddons(parentPath.concat(name), addon.addons, summary, options);
    }
  }
}

const IGNORED_ADDONS = [
 'ember-cli-htmlbars',
 'ember-cli-babel',
 'ember-cli-sass',
 'ember-cli-node-assets',
 'ember-cli-htmlbars-inline-precompile',
 'ember-auto-import',
 'ember-cli-typescript'
];
