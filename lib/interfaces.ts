export interface AddonGuardConfig {
  skipBuildChecks?: boolean;
  skipCacheKeyDependencyChecks?: boolean;
  ignoreAddons?: string[];
}

export interface Dict<T = unknown> {
  [key: string]: T;
}

export type path = string[];

export interface AddonVersionSummary {
  version: string;
  dependents: path[];
  cacheKey?: string;
  runtime?: boolean;
}

export type AddonSummary = Dict<AddonVersionSummary>;

export interface ProjectSummary {
  addons: Dict<AddonSummary>;
  errors: string[];
}
