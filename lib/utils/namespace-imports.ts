import { addPlugin } from 'ember-cli-babel-plugin-helpers';
import buildNamespaceAddonImportsPlugin from '../plugins/namespace-addon-imports-babel';

/**
 * Add a babel plugin to the parent registry for transforming import statements.
 *
 * Note: "user plugins" are referenced here: https://github.com/babel/ember-cli-babel/blob/03324217d4ec9b783362d943a31916538ca36510/index.js#L292
 */
export function namespaceImports(appOrAddon: any, name: string, cacheKey: string):void  {
  appOrAddon.options = appOrAddon.options || {};
  appOrAddon.options.babel = appOrAddon.options.babel || {};
  appOrAddon.options.babel.plugins = appOrAddon.options.babel.plugins || [];

  const appOrAddonName = typeof appOrAddon.name === 'function' ? appOrAddon.name() : appOrAddon.name;

  // console.log('namespacing imports:', appOrAddonName, name, cacheKey, appOrAddon.options.babel.plugins.length);

  addPlugin(
    appOrAddon.options.babel.plugins,
    [
      buildNamespaceAddonImportsPlugin() as any,
      {
        name,
        cacheKey,
        appOrAddonName
      },
      `${name}-${cacheKey}-${appOrAddonName}`
    ]
  );
}
