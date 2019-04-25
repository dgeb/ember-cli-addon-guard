import Funnel from 'broccoli-funnel';
import BroccoliDebug from 'broccoli-debug';
import babel from 'broccoli-babel-transpiler';
import MergeTrees from 'broccoli-merge-trees';
import { AddonVersionSummary } from "../interfaces";
import path from 'path';
import { namespaceImports } from './namespace-imports';
import { namespaceTemplates } from './namespace-templates';
import buildNamespaceAddonImportsPlugin from '../plugins/namespace-addon-imports-babel';
import walkSync from 'walk-sync';

const resolvablePatterns = ['helpers/**', 'components/**', 'modifiers/**', 'templates/components/**'];

/**
 * Discover template resolvable names by walking through folders that
 * contain resolvable modules.
 */
export function templateResolvableNames(rootPath: string): string[] {
  const resolvableNamesAndDirs = walkSync(path.join(rootPath, 'app'), { globs: resolvablePatterns });
  const resolvableNames = [];

  for (let resolvableNameOrDir of resolvableNamesAndDirs) {
    let parts = path.parse(resolvableNameOrDir);
    if (parts.dir && parts.name) {
      resolvableNames.push(parts.name);
    }
  }

  return resolvableNames;
}

export default function namespaceAddon(addonVersionSummary: AddonVersionSummary): void {
  // console.log('namespaceAddon:', addonVersionSummary.version);

  for (let addonInstance of addonVersionSummary.instances) {
    const { name } = addonInstance;
    const { cacheKey } = addonVersionSummary;

    // console.log('namespacing instance:', name, cacheKey);

    const originalTreeGenerator = addonInstance.treeGenerator;
    addonInstance.treeGenerator = function(fullPath) {
      let pathSegments = fullPath.split(path.sep);

      let type = pathSegments[pathSegments.length - 1];

      if (type === 'templates') {
        type = pathSegments[pathSegments.length - 2] + '/' + type;
      }

      // console.log('treeGenerator', name, cacheKey, type);

      let result = originalTreeGenerator.call(this, fullPath);

      if (type === 'addon' || type === 'addon/templates') {
        /**
         * Namespace any of this addon's modules in the `addon` tree according
         * to its `cacheKey`.
         *
         * A given helper, such as:
         *   `my-addon/helpers/addon-version`
         *
         * Will be namespaced in the `addon` tree as:
         *   `my-addon/ns/bfc08628a53622a84307c3864928b5a2/helpers/addon-version`
         */
        let debugTree = new BroccoliDebug(result, `treeGenerator:${name}:${cacheKey}:${type}:input`);

        let output = new Funnel(debugTree, {
          destDir: `ns/${cacheKey}`
        });

        result = new BroccoliDebug(output, `treeGenerator:${name}:${cacheKey}:${type}:output`);

      } else if (type === 'app') {
        /**
         * Namespace any of this addon's modules in the `app` tree according to
         * the pattern that will be used for resolution.
         *
         * A given helper, such as:
         *   `my-addon/helpers/addon-version`
         *
         * Will be namespaced in the app tree as:
         *   `host-app/helpers/addon-version-bfc08628a53622a84307c3864928b5a2`
         *
         * So that it will be properly resolved when it appears in templates as:
         *   `{{addon-version-bfc08628a53622a84307c3864928b5a2}}`
         */
        let unresolvedThings = new Funnel(result, {
          exclude: resolvablePatterns,
        });

        let debugTree = new BroccoliDebug(result, `treeGenerator:${name}:${cacheKey}:${type}:input`);

        let resolvedThings = new Funnel(debugTree, {
          include: resolvablePatterns,
          getDestinationPath(relativePath) {
            let parts = path.parse(relativePath);

            return `${parts.dir}/${parts.name}-${cacheKey}${parts.ext}`;
          }
        });

        let resolvedThingsOutput = new BroccoliDebug(resolvedThings, `treeGenerator:${name}:${cacheKey}:${type}:output`);

        let resolvedThingsNamespaced = babel(resolvedThingsOutput, {
          plugins: [[
            buildNamespaceAddonImportsPlugin(),
            { name, cacheKey, appOrAddonName: addonInstance.name },
            `${name}-${cacheKey}-${addonInstance.name}`
          ]]
        });

        let resolvedThingsNamespacedOutput = new BroccoliDebug(resolvedThingsNamespaced, `treeGenerator:${name}:${cacheKey}:${type}:namespaced`);

        result = new MergeTrees([unresolvedThings, resolvedThingsNamespacedOutput]);
      }

      return result;
    }

    const addonParent = addonInstance.parent === addonInstance.project ? addonInstance.app : addonInstance.parent;

    // Namespace any imports in the addon itself and its parent
    namespaceImports(addonInstance, name, cacheKey);
    namespaceImports(addonParent, name, cacheKey);

    // Discover template resolvable names by walking through folders that
    // contain resolvable modules.
    const templateNamespacingOptions = {
      namespace: cacheKey,
      names: templateResolvableNames(addonInstance.root)
    };

    // Namespace any resolvable names in the addon's templates or in its
    // parent's templates
    namespaceTemplates(addonInstance, templateNamespacingOptions);
    namespaceTemplates(addonParent, templateNamespacingOptions);
  }
}
