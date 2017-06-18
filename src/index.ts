import findPackages from 'find-packages'
import semver = require('semver')
import commonTags = require('common-tags')
import chalk = require('chalk')
import R = require('ramda')
import toposort = require('toposort')
import npa = require('npm-package-arg')
import path = require('path')

const oneLine = commonTags.oneLine
const highlight = chalk.yellow

export type Manifest = {
  name: string,
  version: string,
  dependencies?: {
    [name: string]: string,
  },
  devDependencies?: {
    [name: string]: string,
  },
  optionalDependencies?: {
    [name: string]: string,
  },
}

export type Package = {
  manifest: Manifest,
  path: string,
}

export type PackageNode = Package & {
  dependencies: string[],
}

export default function (pkgs: Package[]): {[id: string]: PackageNode} {
  const pkgMap = createPkgMap(pkgs)
  const pkgNodeMap = Object.keys(pkgMap)
    .reduce((acc, pkgSpec) => {
      acc[pkgSpec] = Object.assign({}, pkgMap[pkgSpec], {
        dependencies: createNode(pkgMap[pkgSpec])
      })
      return acc
    }, {})

  return pkgNodeMap

  function createNode(pkg: Package): string[] {
    const dependencies = Object.assign({},
      pkg.manifest.devDependencies,
      pkg.manifest.optionalDependencies,
      pkg.manifest.dependencies)

    return Object.keys(dependencies)
      .map(depName => {
        const spec = npa.resolve(depName, dependencies[depName], pkg.path)

        if (spec.type === 'directory') {
          const matchedPkg = R.values(pkgMap).find(pkg => pkg.path === spec.fetchSpec)
          if (!matchedPkg) {
            return ''
          }
          return createPkgSpec(matchedPkg!)
        }

        if (spec.type !== 'version' && spec.type !== 'range') return ''

        const range = dependencies[depName]

        const pkgs = R.values(pkgMap).filter(pkg => pkg.manifest.name === depName)
        if (!pkgs.length) return ''
        const versions = pkgs.map(pkg => pkg.manifest.version)
        if (versions.indexOf(range) !== -1) {
          const matchedPkg = pkgs.find(pkg => pkg.manifest.name === depName && pkg.manifest.version === range)
          return createPkgSpec(matchedPkg!)
        }
        const matched = semver.maxSatisfying(versions, range)
        if (!matched) {
          console.warn(oneLine`
            Cannot find local package ${highlight(depName)} satisfying ${highlight(range)}
          `)
          return ''
        }
        const matchedPkg = pkgs.find(pkg => pkg.manifest.name === depName && pkg.manifest.version === matched)
        return createPkgSpec(matchedPkg!)
      })
      .filter(Boolean)
  }
}

function createPkgMap(pkgs: Package[]): {
  [pkgId: string]: Package
} {
  const pkgMap = {}
  for (let pkg of pkgs) {
    const spec = createPkgSpec(pkg)
    if (pkgMap[spec]) {
      throw new Error(`There are two ${pkg.manifest.name} packages of the same version in the monorepo.
        Either remove or ignore one of them.
        One at ${pkgMap[spec].path}
        The other at ${pkg.path}`)
    }
    pkgMap[spec] = pkg
  }
  return pkgMap
}

function createPkgSpec(pkg: Package) {
  if (!pkg.manifest.name || !pkg.manifest.version) return pkg.path
  return `${pkg.manifest.name}@${pkg.manifest.version}`
}
