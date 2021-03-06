import archy from 'archy';
import { Dict, AddonVersionSummary } from '../interfaces';

export type Printer = (version: string, cacheKey: string, runtime: boolean) => string;

/**
 * Given an addon name, a hash of dependents by version (as returned by discoverAddonVersions),
 * and optionally a function to determine how the addon itself is printed, returns a string
 * containing a printable version of the structure.
 */
export default function dependentsToString(name: string, instances: Dict<AddonVersionSummary>, printer?: Printer): string {
  const tree: any = {};

  for (const cacheKey of Object.keys(instances)) {
    const instance = instances[cacheKey];
    const { version, runtime, dependents } = instance;

    for (const dependent of dependents) {
      let node = tree;
      for (const layer of dependent) {
        if (!node[layer]) node[layer] = {};
        node = node[layer];
      }
      if (printer) {
        node[name] = printer(version, cacheKey, runtime);
      } else {
        let details = [];

        if (cacheKey && cacheKey !== version) {
          details.push(`cacheKey: ${cacheKey}`);
        }
        if (runtime) {
          details.push(`runtime: true`);
        }

        node[name] = `${name}@${version}`;

        if (details.length > 0) {
          node[name] += ` (${details.join(', ')})`;
        }
      }
    }
  }

  const root = Object.keys(tree)[0];
  return archy(transformTree(root, name, tree[root]));
}

// Transform the tree from a structure that's convenient to build into the one archy expects
function transformTree(name: string, addon: string, tree: any): archy.Data {
  return {
    label: name,
    nodes: sortKeys(addon, tree).map((key) => {
      if (key === addon) {
        return tree[key];
      } else {
        return transformTree(key, addon, tree[key]);
      }
    }),
  };
}

// Boost the addon in question to the top, then alphabetize the rest
function sortKeys(addon: string, tree: any) {
  return Object.keys(tree).sort((a, b) => {
    if (a === addon) {
      return -1;
    } else if (b === addon) {
      return 1;
    } else {
      return a < b ? -1 : 1;
    }
  });
}
