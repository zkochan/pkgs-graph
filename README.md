# pkgs-graph

> Create a graph from an array of packages

[![Build Status](https://img.shields.io/travis/zkochan/pkgs-graph/master.svg)](https://travis-ci.org/zkochan/pkgs-graph) [![npm version](https://img.shields.io/npm/v/pkgs-graph.svg)](https://www.npmjs.com/package/pkgs-graph)

## Installation

```
npm i -g pkgs-graph
```

## Usage

```js
import createPkgsGraph from 'pkgs-graph'

const {graph} = createPkgsGraph([
  {
    manifest: {
      name: 'foo',
      version: '1.0.0',
      dependencies: {
        bar: '^1.0.0',
      },
    },
    path: 'zkochan/src/foo',
  },
  {
    manifest: {
      name: 'bar',
      version: '1.1.0',
    },
    path: 'zkochan/src/bar',
  }
])

console.log(graph)
//> {
//    'foo@1.0.0': {
//      dependencies: ['bar@1.1.0'],
//      manifest: {
//        name: 'foo',
//        version: '1.0.0',
//        dependencies: {
//          bar: '^1.0.0',
//        },
//      },
//      path: 'zkochan/src/foo',
//    },
//    'bar@1.1.0': {
//      dependencies: [],
//      manifest: {
//        name: 'bar',
//        version: '1.1.0',
//      },
//      path: 'zkochan/src/bar',
//    },
//  }
```

## Related

* [find-packages](https://github.com/zkochan/find-packages) - Find all packages inside a directory
* [sort-pkgs](https://github.com/zkochan/sort-pkgs) - Sort packages. Dependents first.

## License

[MIT](LICENSE) © [Zoltan Kochan](https://www.kochan.io)
