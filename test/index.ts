import test = require('tape')
import path = require('path')
import createPkgGraph from '../src'

const fixtureDir = path.join(__dirname, 'fixture')

test('create package graph', t => {
  const root = path.join(fixtureDir, '1')
  createPkgGraph(root)
    .then(tree => {
      t.end()
    })
    .catch(t.end)
})

test('create package graph for circular deps', t => {
  const root = path.join(fixtureDir, 'circular')
  createPkgGraph(root)
    .then(tree => {
      t.end()
    })
    .catch(t.end)
})
