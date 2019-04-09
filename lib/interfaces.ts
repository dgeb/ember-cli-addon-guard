export interface AddonGuardConfig {
  ignoreAddons?: string[];
  skipCacheKeyDependencyCheck?: boolean;
}

export interface Dict<T = unknown> {
  [key: string]: T;
}

export type path = string[];

export interface AddonSummary {
  version: string;
  dependents: path[];
}

export type AddonSummaries = Dict<AddonSummary>;

export interface ProjectSummary {
  addons: Dict<AddonSummaries>;
  errors: string[];
  // ignoredAddons: string[];
}
