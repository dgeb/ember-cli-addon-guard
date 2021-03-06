# ember-cli-addon-guard [![Build Status](https://travis-ci.org/dgeb/ember-cli-addon-guard.svg?branch=master)](https://travis-ci.org/dgeb/ember-cli-addon-guard)

This addon guards against addon interop issues that can arise in `ember-cli` projects.

## Motivation

Suppose you're happily building an application using [`ember-modal-dialog`](https://github.com/yapplabs/ember-modal-dialog), which in turn relies on [`ember-wormhole`](https://github.com/yapplabs/ember-wormhole) at `0.3.x`. You then go add [`ember-power-select`](https://github.com/cibernox/ember-power-select), which relies also relies on `ember-wormhole` via [`ember-basic-dropdown`](https://github.com/cibernox/ember-basic-dropdown), but at `0.5.x`. Your dependencies might now look like this:

```
my-app
├─┬ ember-modal-dialog
│ └── ember-wormhole@0.3.6
└─┬ ember-power-select
  └─┬ ember-basic-dropdown
    └── ember-wormhole@0.5.1
```

Your package manager notices the conflicting version requirements for `ember-wormhole` and helpfully makes sure each addon gets the version it's asking for. But your final built application will only have one copy of `ember-wormhole` — which version will it be?

`ember-cli`'s current build process will merge both versions together, with files from one version clobbering files from the other whenever they have the same name. This also means either `ember-modal-dialog` or `ember-power-select` will wind up attempting to use a version of `ember-wormhole` that it's not expecting, which can lead to anything from hard exceptions to subtle behavioral bugs.

In the scenario described above, the version conflict arose because of adding a new dependency, but it can also happen when you update an existing one. Regardless of how it happens, it may or may not immediately be obvious that something is wrong. The things that break may be subtle, or in untested edges cases in your application.

## Solution

As with any problem, the first step towards a solution is identifying the problem. By default, `ember-cli-addon-guard` runs prior to every build and checks the full dependency tree for duplicate addons of different versions.  Any cases of addon duplication will be examined to see if the addons introduce browser run-time code. If a run-time duplication conflict is found, the problem will be logged in detail and a hard error will prevent the build from proceeding until conflicts have been resolved.

Once a build has been blocked, what's the best way to resolve dependency conflicts? Let's say that multiple versions of `ember-wormhole` have been identified. To avoid these problems "manually", you could take one of the following steps:

 - pin your app's `ember-power-select` dependency to an older version that uses `ember-wormhole` 0.3 (if one exists) until `ember-modal-dialog` is updated
 - fork `ember-modal-dialog` and make whatever changes are necessary for it to work with `ember-wormhole` 0.5, then use your fork until those changes are accepted upstream

You can also take a more automated approach to remove duplicate packages across your entire project. If you're using `yarn` as your package manager, consider using [yarn-deduplicate](https://github.com/atlassian/yarn-deduplicate).

`ember-cli-addon-guard` also offers its own (_experimental!_) solution to this problem: namespacing. Namespacing allows multiple versions of a single addon to co-exist in the same project without clobbering each other. You must explicitly opt-in to namespacing via the `namespaceAddons` array in your config file (see below). Namespacing should be used with caution and tested thoroughly.

As a last resort, if duplication of a specific addon is truly not an issue for your application, you can choose to explicitly ignore addons via the `ignoreAddons` array in your config file (see below).

### Browser-run-time vs. Build-time-only Addons

Some addons don't actually add files to your application tree, so they don't have the conflict problem described above. In fact, for some addons (like preprocessors such as ember-cli-babel), insisting on a single version is undesirable. Different addons your app uses should be able to compile using whatever tooling they like without conflicting with one another.

For this reason, `ember-cli-addon-guard` is only concerned with preventing multiple versions of _browser-run-time_ dependencies from co-existing in a project. In order to determine whether an addon contains browser-run-time code, it's checked to see if it contains `addon`, `app`, or `src` directories.

### Cache-keys vs. Versions

So far, we've discussed addon duplication in terms of addon names and versions. `ember-cli` currently takes a dynamic and customizable approach to identifying unique instances of addons: cache-keys. By default, an addon's cache-key is calculated from a hash of its package.json (minus any private keys). An addon may also customize its cache-key, via a custom implementation of `cacheKeyForTree`, which can be narrower _or_ broader than the default cache-key.

For consistency with `ember-cli` and its ecosystem, `ember-cli-addon-guard` also relies upon each addon's cache-key to determine uniqueness if that addon supports `cacheKeyForTree`. When cache-keys are used, they will be displayed together with version in dependency trees.

Usage of cache-keys will go away with the introduction of [embroider](https://github.com/embroider-build/embroider/blob/master/SPEC.md) v2 addons, which take a static approach to identifying package uniqueness that is simpler and more robust. `ember-cli-addon-guard` will remain compatible with these embroider packages by reverting to version keys when addons don't support `cacheKeyForTree`.

_Note: The addon that calculates cache-keys by default, `calculate-cache-key-for-tree`, was just recently updated to ignore private, package-manager-specific keys that may be added to `package.json` files. Prior to v1.2.3, this may have made cache-keys much more unique and created a lot of false-positives when checking for multiple versions of an addon. For this reason, `ember-cli-addon-guard` includes a validation check to ensure that any instances of `calculate-cache-key-for-tree` that are encountered are version >= 1.2.3._

## Usage

When `ember-cli-addon-guard` is added to your project, it will automatically attempt to identify and circumvent conflicts prior to every build.

You can also manually run `ember addon-guard` to get a detailed report of any problems encountered in a project without performing a build.

### Configuration

Configuration for this addon is specified in a dedicated file in your project's `config` folder. For apps, this will be `config/addon-guard.js`, and for addons, this will be the dummy app's `tests/dummy/config/addon-guard.js`.

This configuration file allows you to safelist any addons you'd like to ignore with the `ignoreAddons` member:

```js
// config/addon-guard.js
module.exports = {
  ignoreAddons: [
    'ember-yolo',
    'ember-wat'
  ]
};
```

Other configuration options include:

* `skipBuildChecks: true` - specify if you only want to run `ember-cli-addon-guard` via its CLI, and not during every build.

* `skipCacheKeyDependencyChecks: true` - skip the cache-key dependency checks mentioned above.

### EXPERIMENTAL: Namespacing

_IMPORTANT: The namespacing feature should be considered experimental, used with caution, and thoroughly tested._

In order to try the experimental namespacing feature of `ember-cli-addon-guard`, list any addons you'd like namespaced in the `namespaceAddons` member of your configuration file:

```js
// config/addon-guard.js
module.exports = {
  namespaceAddons: [
    'ember-yolo',
    'ember-wat'
  ]
};
```

How does namespacing work? As described above, every unique instance of an addon can identified via its cache-key. Namespacing inserts this cache-key in the path of every module provided by the namespaced addon, and all imports from those modules are adjusted accordingly. Furthermore, namespacing must also be applied to resolvable elements in templates, such as helpers and components. This last portion feels like a clear boundary violation that, thankfully, should be unnecssary once template imports are introduced in the next edition of Ember. For now, please be aware that there are some edge cases that simply don't work yet with namespacing - such as using the `component` helper to dynamically invoke a namespaced component.

## History and Attribution

This project is based upon the excellent [ember-cli-dependency-lint](https://github.com/salsify/ember-cli-dependency-lint) addon. It was forked from the original project for the following reasons:

* `ember-cli-addon-guard` does not attempt to be backward compatible with `ember-cli-dependency-lint`, and it's anticipated that both will evolve independently. Both addons have unique configuration files and approaches that should not conflict.

* By default, `ember-cli-addon-guard` runs prior to every build and strictly prevents addon dependency conflicts that have not been explicitly ignored.

* `ember-cli-addon-guard` is only concerned with addons that introduce run-time modules. This is inferred from the directories and files present in each addon. Build-time-only addons don't need to be explicitly safelisted, as they do in `ember-cli-dependency-lint`.

* `ember-cli-addon-guard` identifies addons uniquely by name and _cache-key_, if available, for compatibility with the current approach taken by `ember-cli`. If cache-keys are not supported by a particular addon, version will be used, which should be forward-compatible with embroider (as explained above).

_Note from @dgeb: I'll be glad to contribute this fork back to Salsify or to the ember-cli org, wherever it can be most useful. Hopefully, a single, shared solution will be adopted by default for ember-cli projects, as is being discussed in [Ember RFC 464](https://github.com/emberjs/rfcs/pull/464)._

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
