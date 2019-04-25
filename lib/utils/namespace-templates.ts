import buildTemplateNamespacingPlugin, { NamespaceAddonInTemplatesOptions } from '../plugins/namespace-addon-in-templates-babel';

export function namespaceTemplates(appOrAddon: any, options: NamespaceAddonInTemplatesOptions):void  {
  // console.log('namespacing templates:', typeof appOrAddon.name === 'function' ? appOrAddon.name() : appOrAddon.name, options);

  appOrAddon.registry.add('htmlbars-ast-plugin', {
    name: 'addon-guard-template-transform',
    baseDir: () => __dirname,
    plugin: buildTemplateNamespacingPlugin(options)
  });
}
