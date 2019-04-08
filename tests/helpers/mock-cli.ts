import path from 'path';
import MockUI from 'console-ui/mock';
import Instrumentation from 'ember-cli/lib/models/instrumentation';
import PackageInfoCache from 'ember-cli/lib/models/package-info-cache';

export default class MockCLI {
  ui: MockCLI;
  root: string;
  npmPackage: string;
  instrumentation: Instrumentation;
  packageInfoCache: PackageInfoCache;

  constructor(options: any = {}) {
    this.ui = options.ui || new MockUI();
    this.root = path.join(__dirname, '..', '..');
    this.npmPackage = options.npmPackage || 'ember-cli';
    this.instrumentation = options.instrumentation || new Instrumentation({});
    this.packageInfoCache = new PackageInfoCache(this.ui);
  }
}
