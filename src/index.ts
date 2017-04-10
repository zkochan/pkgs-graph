import findPackages from 'find-packages'
import semver = require('semver')
import commonTags = require('common-tags')
import chalk = require('chalk')
import R = require('ramda')

const oneLine = commonTags.oneLine
const highlight = chalk.yellow

export type Manifest = {
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

export type Package = {
  manifest: Manifest,
  path: string,
}

export type PackageNode = Package & {
  dependencies: PackageNode[],
  depth: number,
}

export default async function (
  root: string,
  opts?: { ignore?: string[] }
): Promise<PackageNode[]> {
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
        const pkgs = R.values(pkgMap).filter(pkg => pkg.manifest.name === depName)
        if (!pkgs.length) return ''
        const matched = semver.maxSatisfying(pkgs.map(pkg => pkg.manifest.version), range)
        const matchedPkg = pkgs.find(pkg => pkg.manifest.name === depName && pkg.manifest.version === matched)
        return createPkgMajorId(matchedPkg!.manifest.name, matchedPkg!.manifest.version, matchedPkg!.path)
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
  return resolvePackageNodes(entries, pkgsMap, [])
}

function resolvePackageNodes(entries, pkgsMap, keypath: string[]) {
  return entries.reduce((acc, entry) => {
    const entryPkg = pkgsMap[entry]
    const dependencies = resolvePackageNodes(entryPkg.dependencies, pkgsMap, R.append(entry, keypath))
    return acc.concat([{
      manifest: entryPkg.manifest,
      path: entryPkg.path,
      dependencies,
      depth: keypath.length,
    }].concat(dependencies))
  }, [])
}

function createPkgMap(pkgs: Package[]): {
  [pkgId: string]: Package
} {
  const pkgMap = {}
  for (let pkg of pkgs) {
    const pkgMajorId = createPkgMajorId(pkg.manifest.name, pkg.manifest.version, pkg.path)
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

function createPkgMajorId(name: string, version: string, pkgPath: string) {
  if (!name || !version) return pkgPath
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
