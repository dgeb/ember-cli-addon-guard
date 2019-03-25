# ember-cli-addon-guard

This addon guards against addon interop issues that can arise in ember-cli projects.

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

Your package manager notices the conflicting version requirements for `ember-wormhole` and helpfully makes sure each addon gets the version it's asking for. But your final built application will only have one copy of `ember-wormhole`—which version will it be?

In the end, Ember CLI will merge both versions together, with files from one version clobbering files from the other whenever they have the same name. This also means either `ember-modal-dialog` or `ember-power-select` will wind up attempting to use a version of `ember-wormhole` that it's not expecting, which can lead to anything from hard exceptions to subtle behavioral bugs.

In the scenario described above, the version conflict arose because of adding a new dependency, but it can also happen when you update an existing one. Regardless of how it happens, it may or may not immediately be obvious that something is wrong. The things that break may be subtle, or in untested edges cases in your application.

## Solution

To avoid the problems described above, `ember-cli-addon-guard` simply stops problematic builds from succeeding.

Prior to every build, the full dependency tree is checked for duplicate addons of different versions. Any cases of addon duplication will be examined to see if the addons introduce run-time code. If a run-time duplication conflict is found, the problem will be logged in detail and a hard error will prevent the build from proceeeding until conflicts have been resolved.

### Run-time vs. Build-time Addons

Some addons don't actually add files to your application tree, so they don't have the conflict problem described above. In fact, for some addons (like preprocessors such as ember-cli-babel), insisting on a single version is undesirable. Different addons your app uses should be able to compile using whatever tooling they like without conflicting with one another.

For this reason, `ember-cli-addon-guard` is only concerned with preventing multiple versions of _run-time_ dependencies from co-existing in a project. In order to determine whether an addon contains run-time code, it's checked to see if it contains `addon`, `app`, or `src` directories.

### Dealing with Conflicts

In the `ember-wormhole` example above, you have several options you might choose from:

 - pin your app's `ember-power-select` dependency to an older version that uses `ember-wormhole` 0.3 (if one exists) until `ember-modal-dialog` is updated
 - fork `ember-modal-dialog` and make whatever changes are necessary for it to work with `ember-wormhole` 0.5, then use your fork until those changes are accepted upstream

Another option is also available with `ember-cli-addon-guard`: multiple versions of addons can be allowed to coexist by namespacing each of them by their version. When these addons are merged together, their names will now be unique, which should allow them to co-exist. This approach should be used with caution and well-tested, but should work with most well-behaved addons that have no concept of shared global state. In order to enable namespacing, each addon must be whitelisted (see below).

## Usage

When `ember-cli-addon-guard` is added to your project, it will automatically attempt to identify and circumvent conflicts prior to every build.

You can also manually run `ember addon-guard` to get a more detailed report of any problems encountered in a project.

## Configuration

Configuration for this addon is specified in a dedicated file in your project's `config` folder. For apps, this will be `config/addon-guard.js`, and for addons, this will be the dummy app's `tests/dummy/config/addon-guard.js`.

This configuration file allows you to safelist any addons you'd like to ignore as follows:

```js
// config/addon-guard.js
module.exports = {
  ignoreAddons: [
    'ember-yolo',
    'ember-wat'
  ]
};
```

### Coming Soon

The `namespaceAddons` option is not yet supported, but will soon allow you to opt-in to namespacing specific addons that you need to co-exist with different versions:

```js
// config/addon-guard.js
module.exports = {
  namespaceAddons: [
    'ember-wormhole',
    'sparkles-component'
  ]
};
```

## History and Attribution

This project is based upon the excellent [ember-cli-dependency-lint](https://github.com/salsify/ember-cli-dependency-lint) addon. A fork of that project was created for several reasons:

* `ember-cli-addon-guard` does not attempt to be backward compatible with `ember-cli-dependency-lint`, and it's anticipated that both will evolve independently. Both have unique configuration files and options, so they should not conflict.

* `ember-cli-addon-guard` runs before every build and strictly prevents addon dependency conflicts that have not been explicitly ignored.

* `ember-cli-addon-guard` will soon provide an option to namespace specific addons in order to provide conflicts.

* `ember-cli-addon-guard` is only concerned with addons that are built for _run-time_. This is inferred from the directories and files present in addons.

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
