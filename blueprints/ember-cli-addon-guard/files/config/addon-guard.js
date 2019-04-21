'use strict';

module.exports = {
  /**
   * If you only want to run ember-cli-addon-guard via its CLI, and not during
   * every build, then set `skipBuildChecks: true`.
   */
  skipBuildChecks: false,

  /**
   * Normally, ember-cli-addon-guard will verify that every addon that depends
   * on calculate-cache-key-for-tree is using an updated version. This protects
   * against cache key calculations that may lead to excessive caching and
   * duplication.
   *
   * To skip these checks, set `skipCacheKeyDependencyChecks: true`.
   */
  skipCacheKeyDependencyChecks: false,

  /**
   * List the names of any addons that you want ember-cli-addon-guard to
   * completely ignore while it's checking for problems.
   */
  ignoreAddons: [
  ],

  /**
   * List the names of any addons that you want ember-cli-addon-guard to
   * namespace if it encounters multiple versions.
   */
  namespaceAddons: [
  ]
};
