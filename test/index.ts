import test = require('tape')
import createPkgGraph from 'pkgs-graph'
import path = require('path')

test('create package graph', t => {
  const graph = createPkgGraph([
    {
      manifest: {
        name: 'bar',
        version: '1.0.0',
        dependencies: {
          'is-positive': '1.0.0',
          foo: '^1.0.0'
        }
      },
      path: '/zkochan/src/bar',
    },
    {
      manifest: {
        name: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^10.0.0'
        }
      },
      path: '/zkochan/src/foo',
    },
    {
      manifest: {
        name: 'bar',
        version: '2.0.0',
        dependencies: {
          foo: '^2.0.0'
        }
      },
      path: '/zkochan/src/bar@2',
    },
    {
      manifest: {
        name: 'foo',
        version: '2.0.0',
      },
      path: '/zkochan/src/foo@2',
    },
  ])
  t.deepEqual(graph, {
    'bar@1.0.0': {
      manifest: {
        name: 'bar',
        version: '1.0.0',
        dependencies: {
          'is-positive': '1.0.0',
          foo: '^1.0.0'
        }
      },
      path: '/zkochan/src/bar',
      dependencies: ['foo@1.0.0'],
    },
    'foo@1.0.0': {
      manifest: {
        name: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^10.0.0'
        }
      },
      path: '/zkochan/src/foo',
      dependencies: [],
    },
    'bar@2.0.0': {
      manifest: {
        name: 'bar',
        version: '2.0.0',
        dependencies: {
          foo: '^2.0.0'
        }
      },
      path: '/zkochan/src/bar@2',
      dependencies: ['foo@2.0.0'],
    },
    'foo@2.0.0': {
      manifest: {
        name: 'foo',
        version: '2.0.0',
      },
      path: '/zkochan/src/foo@2',
      dependencies: [],
    },
  })
  t.end()
})

test('create package graph for local directory dependencies', t => {
  const graph = createPkgGraph([
    {
      manifest: {
        name: 'bar',
        version: '1.0.0',
        dependencies: {
          'is-positive': '1.0.0',
          foo: '../foo'
        }
      },
      path: '/zkochan/src/bar',
    },
    {
      manifest: {
        name: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^10.0.0'
        }
      },
      path: '/zkochan/src/foo',
    },
    {
      manifest: {
        name: 'bar',
        version: '2.0.0',
        dependencies: {
          foo: 'file:../foo@2'
        }
      },
      path: '/zkochan/src/bar@2',
    },
    {
      manifest: {
        name: 'foo',
        version: '2.0.0',
      },
      path: '/zkochan/src/foo@2',
    },
  ])
  t.deepEqual(graph, {
    'bar@1.0.0': {
      manifest: {
        name: 'bar',
        version: '1.0.0',
        dependencies: {
          'is-positive': '1.0.0',
          foo: '../foo'
        }
      },
      path: '/zkochan/src/bar',
      dependencies: ['foo@1.0.0'],
    },
    'foo@1.0.0': {
      manifest: {
        name: 'foo',
        version: '1.0.0',
        dependencies: {
          bar: '^10.0.0'
        }
      },
      path: '/zkochan/src/foo',
      dependencies: [],
    },
    'bar@2.0.0': {
      manifest: {
        name: 'bar',
        version: '2.0.0',
        dependencies: {
          foo: 'file:../foo@2'
        }
      },
      path: '/zkochan/src/bar@2',
      dependencies: ['foo@2.0.0'],
    },
    'foo@2.0.0': {
      manifest: {
        name: 'foo',
        version: '2.0.0',
      },
      path: '/zkochan/src/foo@2',
      dependencies: [],
    },
  })
  t.end()
})
