import findPackages from 'find-packages'
import semver = require('semver')
import commonTags = require('common-tags')
import chalk = require('chalk')
import R = require('ramda')
import majors = require('major-versions')

const oneLine = commonTags.oneLine
const highlight = chalk.yellow

type Manifest = {
  name: string,
  version: string,
  dependencies: {
    [name: string]: string,
  },
  devDependencies: {
    [name: string]: string,
  },
  optionalDependencies: {
    [name: string]: string,
  },
}

type Package = {
  manifest: Manifest,
  path: string,
}

type PackageNode = Package & {
  dependencies: Package[]
}

export default async function (
  root: string,
  opts?: { ignore?: string[] }
) {
  const pkgs: Package[] = await findPackages(root, {
    ignore: opts && opts.ignore
  })

  const pkgMap = createPkgMap(pkgs)
  const pkgNodeMap = Object.keys(pkgMap)
    .reduce((acc, pkgMajorId) => {
      acc[pkgMajorId] = Object.assign({}, pkgMap[pkgMajorId], {
        pkgMajorId,
        dependencies: createNode(pkgMap[pkgMajorId])
      })
      return acc
    }, {})

  return toTree(pkgNodeMap)

  function createNode(pkg: Package): string[] {
    const dependencies = Object.assign({},
      pkg.manifest.devDependencies,
      pkg.manifest.optionalDependencies,
      pkg.manifest.dependencies)

    return Object.keys(dependencies)
      .map(depName => {
        const range = dependencies[depName]
        const major = getMajorFromRange(range)
        return `${depName}@${major}`
      })
      .filter(pkgMajorId => pkgMap[pkgMajorId])
      .filter(pkgMajorId => areCompatible(pkg.manifest.name, dependencies[pkgMap[pkgMajorId].manifest.name], pkgMap[pkgMajorId].manifest))
  }
}

function toTree(pkgsMap) {
  const dependents = {}
  for (let pkg of R.values<any>(pkgsMap)) {
    for (let depId of pkg.dependencies) {
      dependents[depId] = dependents[depId] || []
      dependents[depId].push(pkg.pkgMajorId)
    }
  }
  const entries = Object.keys(pkgsMap).filter(pkgId => !dependents[pkgId] || !dependents[pkgId].length)
  return entries.map(entry => resolveTree(entry, pkgsMap, [entry]))
}

function resolveTree(majorId: string, pkgsMap, keypath: string[]) {
  const entryPkg = pkgsMap[majorId]
  return {
    manifest: entryPkg.manifest,
    path: entryPkg.path,
    dependencies: entryPkg.dependencies.map(depId => resolveTree(depId, pkgsMap, R.append(depId, keypath))),
    depth: keypath.length,
  }
}

function createPkgMap(pkgs: Package[]): {
  [pkgId: string]: Package
} {
  const pkgMap = {}
  for (let pkg of pkgs) {
    const pkgMajorId = createPkgMajorId(pkg.manifest.name, pkg.manifest.version)
    if (pkgMap[pkgMajorId]) {
      throw new Error(`There are two ${pkg.manifest.name} packages of the same major versions in the monorepo.
        Either remove or ignore one of them.
        One at ${pkgMap[pkgMajorId].path}
        The other at ${pkg.path}`)
    }
    pkgMap[pkgMajorId] = pkg
  }
  return pkgMap
}

function createPkgMajorId(name: string, version: string) {
  const major = semver.major(version)
  return `${name}@${major}`
}

function areCompatible(dependentName: string, dependentRange: string, dependency: Manifest) {
  if (semver.satisfies(dependency.version, dependentRange)) {
    return true
  }
  const available = `${dependency.name}@${dependency.version}`
  const needed = `${dependency.name}@${dependentRange}`
  console.warn(oneLine`
    Local ${highlight(available)}
    cannot be used by ${highlight(dependentName)} which needs
    ${highlight(needed)}
  `)
  return false
}

function getMajorFromRange(range: string): string {
  const major = majors(range)[0]
  const index = major.indexOf('.')
  if (index === -1) return major
  return major.substr(0, index)
}
