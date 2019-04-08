import path from 'path';

/**
 * Given a Project instance, returns the custom addon-guard config
 * for that project (if any).
 */
export default function(project: any) {
  const configDirectory = path.dirname(project.configPath());
  try {
    return require(`${configDirectory}/addon-guard`);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return {};
    } else {
      throw error;
    }
  }
}
