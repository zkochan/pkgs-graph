import test = require('tape')
import createPkgGraph from '../src'

test('create package graph', t => {
  const graph = createPkgGraph([
    {
      manifest: {
        name: 'bar',
        version: '1.0.0',
        dependencies: {
          foo: '^1.0.0'
        }
      },
      path: '/zkochan/src/bar',
    },
    {
      manifest: {
        name: 'foo',
        version: '1.0.0',
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
