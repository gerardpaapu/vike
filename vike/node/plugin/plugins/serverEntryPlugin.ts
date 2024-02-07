export { getServerConfig, serverEntryPlugin }

import type { Plugin } from 'vite'
import type { ConfigVikeUserProvided, ServerResolved } from '../../../shared/ConfigVike.js'
import { assertUsage, getGlobalObject, assert, injectRollupInputs } from '../utils.js'
import { standalonePlugin } from './standalonePlugin.js'
import path from 'path'
import pc from '@brillout/picocolors'
import { createRequire } from 'module'
// @ts-ignore Shimmed by dist-cjs-fixup.js for CJS build.
const importMetaUrl: string = import.meta.url
const require_ = createRequire(importMetaUrl)

const globalObject = getGlobalObject<{
  serverConfig: ServerResolved
}>('serverEntryPlugin.ts', {
  serverConfig: undefined
})

function getServerConfig() {
  return globalObject.serverConfig
}

function serverEntryPlugin(configVike?: ConfigVikeUserProvided): Plugin[] {
  const serverConfig = configVike && resolveServerConfig(configVike)
  if (!serverConfig) {
    return []
  }
  globalObject.serverConfig = serverConfig
  const serverEntryProdPlugin = (): Plugin => {
    return {
      name: 'vike:serverEntry',
      enforce: 'pre',
      apply(_config, env) {
        //@ts-expect-error Vite 5 || Vite 4
        return !!(env.isSsrBuild || env.ssrBuild)
      },

      configResolved(config) {
        const entries = Object.entries(serverConfig.entry)
        assert(entries.length)
        const resolvedEntries: { [name: string]: string } = {}
        for (const [name, path_] of entries) {
          let entryFilePath = path.join(config.root, path_)
          try {
            resolvedEntries[name] = require_.resolve(entryFilePath)
          } catch (err) {
            assert((err as Record<string, unknown>).code === 'MODULE_NOT_FOUND')
            assertUsage(
              false,
              `No file found at ${entryFilePath}. Does the value ${pc.cyan(`'${serverConfig.entry}'`)} of ${pc.cyan(
                'server.entry'
              )} point to an existing file?`
            )
          }
        }

        config.build.rollupOptions.input = injectRollupInputs(resolvedEntries, config)
      }
    }
  }

  return [serverEntryProdPlugin(), configVike.standalone && standalonePlugin(serverConfig)].filter(Boolean) as Plugin[]
}

function resolveServerConfig(configVike?: ConfigVikeUserProvided): ServerResolved {
  if (!configVike?.server) {
    return undefined
  }

  if (typeof configVike.server === 'object') {
    if (configVike.server.entry) {
      assertUsage(
        typeof configVike.server.entry === 'string' ||
          (typeof configVike.server.entry === 'object' &&
            Object.entries(configVike.server.entry).every(([, value]) => typeof value === 'string')),
        'server.entry should be a string or an entry mapping { name: path }'
      )
      assertUsage(
        typeof configVike.server.entry !== 'object' ||
          Object.entries(configVike.server.entry).some(([name]) => name === 'index'),
        'missing index entry in server.entry'
      )
    }

    const entriesProvided =
      typeof configVike.server.entry === 'string' ? { index: configVike.server.entry } : configVike.server.entry

    assert('index' in entriesProvided)

    return {
      entry: entriesProvided
    }
  }

  assertUsage(typeof configVike.server === 'string', 'server should be a string')
  return { entry: { index: configVike.server } }
}
