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
    .reduce((acc, pkgSpec) => {
      acc[pkgSpec] = Object.assign({}, pkgMap[pkgSpec], {
        pkgSpec,
        dependencies: createNode(pkgMap[pkgSpec])
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
  }
}

function toTree(pkgsMap) {
  const dependents = {}
  for (let pkg of R.values<any>(pkgsMap)) {
    for (let depId of pkg.dependencies) {
      dependents[depId] = dependents[depId] || []
      dependents[depId].push(pkg.pkgSpec)
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
