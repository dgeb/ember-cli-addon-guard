import { expect } from 'chai';
import dedent from '../../helpers/dedent';
import dependentsToString from '../../../lib/utils/dependents-to-string';

describe('Unit: dependentsToString', function() {
  it('prints simple trees', function() {
    const instances = {
      '123456': {
        version: '1.0.0',
        cacheKey: '123456',
        dependents: [
          ['foo'],
          ['foo', 'bar'],
        ]
      }
    };

    expect(dependentsToString('my-addon', instances)).to.equal(dedent`
      foo
      ├── my-addon@1.0.0 (cacheKey: 123456)
      └─┬ bar
        └── my-addon@1.0.0 (cacheKey: 123456)
    `);
  });

  it('hoists the addon in question and alphabetizes the rest', function() {
    const instances = {
      '123456': {
        version: '1.0.0',
        dependents: [
          ['root'],
          ['root', 'qqqqq'],
          ['root', 'qqqqq', 'aaaaa'],
        ]
      },
      'abcdef': {
        version: '1.2.3',
        dependents: [
          ['root', 'zzzzz'],
          ['root', 'aaaaa'],
          ['root', 'qqqqq', 'zzzzz'],
        ]
      }
    };

    expect(dependentsToString('mmmmm', instances)).to.equal(dedent`
      root
      ├── mmmmm@1.0.0 (cacheKey: 123456)
      ├─┬ aaaaa
      │ └── mmmmm@1.2.3 (cacheKey: abcdef)
      ├─┬ qqqqq
      │ ├── mmmmm@1.0.0 (cacheKey: 123456)
      │ ├─┬ aaaaa
      │ │ └── mmmmm@1.0.0 (cacheKey: 123456)
      │ └─┬ zzzzz
      │   └── mmmmm@1.2.3 (cacheKey: abcdef)
      └─┬ zzzzz
        └── mmmmm@1.2.3 (cacheKey: abcdef)
    `);
  });

  it('ignores printing a cacheKey that is identical to version', function() {
    const instances = {
      '1.0.0': {
        version: '1.0.0',
        cacheKey: '1.0.0',
        dependents: [
          ['foo'],
          ['foo', 'bar'],
        ]
      }
    };

    expect(dependentsToString('my-addon', instances)).to.equal(dedent`
      foo
      ├── my-addon@1.0.0
      └─┬ bar
        └── my-addon@1.0.0
    `);
  });

  it('includes `runtime: true` if appropriate', function() {
    const instances = {
      '123': {
        version: '1.0.0',
        cacheKey: '123',
        runtime: true,
        dependents: [
          ['foo'],
          ['foo', 'bar'],
        ]
      }
    };

    expect(dependentsToString('my-addon', instances)).to.equal(dedent`
      foo
      ├── my-addon@1.0.0 (cacheKey: 123, runtime: true)
      └─┬ bar
        └── my-addon@1.0.0 (cacheKey: 123, runtime: true)
    `);
  });

  it('allows for custom formatting of the addon name', function() {
    const printer = (version, cacheKey, runtime) => `${version}<->${version.split('').reverse().join('')} (cacheKey: ${cacheKey}, runtime: ${runtime})`;
    const instances = {
      '123456': {
        version: '1.0.0',
        runtime: true,
        dependents: [
          ['foo']
        ]
      },
      'abcdef': {
        version: '2.3.4',
        runtime: false,
        dependents: [
          ['foo', 'bar']
        ]
      }
    };

    expect(dependentsToString('my-addon', instances, printer)).to.equal(dedent`
      foo
      ├── 1.0.0<->0.0.1 (cacheKey: 123456, runtime: true)
      └─┬ bar
        └── 2.3.4<->4.3.2 (cacheKey: abcdef, runtime: false)
    `);
  });
});
