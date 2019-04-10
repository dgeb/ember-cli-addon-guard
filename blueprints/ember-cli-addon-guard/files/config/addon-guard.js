'use strict';

module.exports = {
  namespaceAddons: [
  ],
  /**
   * Normally, ember-cli-addon-guard will verify that every addon that depends
   * on calculate-cache-key-for-tree is using an updated version. This protects
   * against cache key calculations that may lead to excessive caching and
   * duplication.
   *
   * To skip these checks, set `skipCacheKeyDependencyChecks: true`.
   */
  skipCacheKeyDependencyChecks: false,

  ignoreAddons: [
  ]
};
