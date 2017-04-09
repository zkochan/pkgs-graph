import test = require('tape')
import path = require('path')
import createPkgGraph from '../src'

test('create package graph', t => {
  const root = path.join(__dirname, 'fixture')
  createPkgGraph(root)
    .then(tree => {
      t.end()
    })
    .catch(t.end)
})
