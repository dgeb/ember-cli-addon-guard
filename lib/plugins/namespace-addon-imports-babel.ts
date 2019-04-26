function namespacePath(path, state) {
  let source = path.node.source && path.node.source.value;

  // Ignore null or relative paths
  if (!source || source.startsWith(".") || source.startsWith("/")) {
    return;
  }

  let { name, cacheKey } = state.opts;
  let naiveTemplatesPath = `${name}/ns/${cacheKey}/templates`;
  let namespacedPath;

  // Ignore any packages we're not targetting
  if (source !== name && !source.startsWith(`${name}/`) ) {
    return;

  // Use custom handling for template paths, which need to have `templates`
  // prior to the namespacing segments because the `templates` tree is
  // (unfortunately) appended separately within the `addon` tree.
  } else if (source.startsWith(naiveTemplatesPath)) {
    namespacedPath = `${name}/templates/ns/${cacheKey}${source.slice(naiveTemplatesPath.length)}`;

  // Ignore any previously namespaced paths
  } else if (source.startsWith(`${name}/ns/`) || source.startsWith(`${name}/templates/ns/`)) {
    return;

  // Perform default namespacing
  } else {
    if (source.startsWith(name + '/templates')) {
      name = name + '/templates';
    }
    namespacedPath = `${name}/ns/${cacheKey}${source.slice(name.length)}`;
  }

  // console.log('namespacedPath', state.opts.appOrAddonName, ':', path.node.source.value, '->', namespacedPath);

  path.node.source.value = namespacedPath;
}

export default function buildNamespaceAddonImportsPlugin() {
  const plugin: any = () => {
    return {
      name: "namespace-addon-imports",
      visitor: {
        ImportDeclaration(path, state) {
          namespacePath(path, state);
        },
        ExportNamedDeclaration(path, state) {
          namespacePath(path, state);
        }
      }
    };
  };

  plugin.baseDir = () => __dirname;

  return plugin;
}
