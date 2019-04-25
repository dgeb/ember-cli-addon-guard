/*
  This diverges from `Ember.String.dasherize` so that`<XFoo />` can resolve to `x-foo`.
  `Ember.String.dasherize` would resolve it to `xfoo`..
*/
const SIMPLE_DASHERIZE_REGEXP = /[A-Z]/g;
const ALPHA = /[A-Za-z]/;
function dasherize(name) {
  return name.replace(SIMPLE_DASHERIZE_REGEXP, (char, index) => {
    if (index === 0 || !ALPHA.test(name[index - 1])) {
      return char.toLowerCase();
    }

    return `-${char.toLowerCase()}`;
  });
}

export interface NamespaceAddonInTemplatesOptions {
  namespace: string;
  names: string[];
}

export default function buildNamespaceAddonInTemplatesPlugin(options: NamespaceAddonInTemplatesOptions) {
  const plugin: any = (env: any) => {
    const { syntax } = env;
    const { builders } = syntax;

    function rewritePath(node) {
      const originalPath = node.path.original;
      // console.log('originalPath', originalPath);

      if (options.names.includes(originalPath)) {
        const nsPath = `${originalPath}-${options.namespace}`;
        // console.log('$$$$ rewritten path:', nsPath);

        node.path = builders.path(nsPath);
      }
    }

    return {
      name: "namespace-addon-templates",
      visitor: {
        ElementNode(node) {
          const firstChar = node.tag.charAt(0);
          const isUpperCase = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();

          if (isUpperCase && options.names.includes(dasherize(node.tag))) {
            const nsTag = `${node.tag}-${options.namespace}`;
            // console.log('#### rewritten element tag:', nsTag);

            node.tag = nsTag;
          }
        },
        MustacheStatement: rewritePath,
        BlockStatement: rewritePath,
        SubExpression: rewritePath
      }
    };
  }

  plugin.baseDir = () => __dirname;

  return plugin;
}
