import isRuntimeAddon from './is-runtime-addon';

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
 *
 *  Possible options:
 *  - ignoreAddons - an array of addon names to ignore
 *  - runtimeOnly - only return runtime addons should be returned
 *  - conflictsOnly - only return addons with > 1 version
 */
export default function reviewProject(project: any, options: any = {}) {
  // TODO const toNamespace = [].concat(config.namespaceAddons || []);
  options.ignoreAddons = IGNORED_ADDONS.concat(options.ignoreAddons || []);

  const summaries = Object.create(null);

  traverseAddons([project.name()], project.addons, summaries, options);

  if (options.conflictsOnly) {
    for (const name in summaries) {
      if (Object.keys(summaries[name]).length < 2) {
        delete summaries[name];
      }
    }
  }

  return summaries;
};

function traverseAddons(parentPath: string[], addons: any, summaries: any, options: any) {
 for (const addon of addons) {
   const name = addon.pkg.name;

   if (!options.ignoreAddons.includes(name) &&
       (!options.runtimeOnly || isRuntimeAddon(addon))) {

     const cacheKey = addon.cacheKeyForTree && addon.cacheKeyForTree();
     const version = addon.pkg.version;

     if (cacheKey && version) {
       const summary = summaries[name] || (summaries[name] = Object.create(null));
       const keyedSummary = summary[cacheKey] || (summary[cacheKey] = {
         version,
         cacheKey,
         dependents: []
       });
       keyedSummary.dependents.push(parentPath);
     }
   }

   traverseAddons(parentPath.concat(name), addon.addons || [], summaries, options);
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
