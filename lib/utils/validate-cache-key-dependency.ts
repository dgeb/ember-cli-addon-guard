import resolve from 'resolve';
import semver from 'semver';

export function cacheKeyDependencyVersion(dependencies: object, basedir: string): string {
  if (dependencies && dependencies['calculate-cache-key-for-tree']) {
    let packagePath = resolve.sync('calculate-cache-key-for-tree/package.json', { basedir });
    return require(packagePath).version;
  }
}

export function validateCacheKeyDependency(version: string): boolean {
  return semver.gt(version, '1.2.2');
}
