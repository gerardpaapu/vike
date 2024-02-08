export default plugin
export { plugin }
// TODO/v1-release: remove
export { plugin as ssr }
export type { ConfigVikeUserProvided as UserConfig }
export { PROJECT_VERSION as version } from './utils.js'

import type { Plugin } from 'vite'
import {
  assertUsage,
  getNodeEnv,
  isNodeEnvDev,
  markEnvAsVikePluginLoaded,
  vikeVitePluginLoadedInProductionError
} from './utils.js'
import { buildConfig } from './plugins/buildConfig.js'
import { previewConfig } from './plugins/previewConfig.js'
import { autoFullBuild } from './plugins/autoFullBuild.js'
import { devConfig } from './plugins/devConfig/index.js'
import { packageJsonFile } from './plugins/packageJsonFile.js'
import { removeRequireHookPlugin } from './plugins/removeRequireHookPlugin.js'
import { importUserCode } from './plugins/importUserCode/index.js'
import { resolveVikeConfig } from './plugins/config/index.js'
import type { ConfigVikeUserProvided } from '../../shared/ConfigVike.js'
import { distFileNames } from './plugins/distFileNames.js'
import { extractAssetsPlugin } from './plugins/extractAssetsPlugin.js'
import { extractExportNamesPlugin } from './plugins/extractExportNamesPlugin.js'
import { suppressRollupWarning } from './plugins/suppressRollupWarning.js'
import { setGlobalContext } from './plugins/setGlobalContext.js'
import { importBuild } from './plugins/importBuild/index.js'
import { commonConfig } from './plugins/commonConfig.js'
import { extensionsAssets } from './plugins/extensionsAssets.js'
import { baseUrls } from './plugins/baseUrls.js'
import { envVarsPlugin } from './plugins/envVars.js'
import pc from '@brillout/picocolors'
import { fileEnv } from './plugins/fileEnv.js'
import { serverEntryPlugin } from './plugins/serverEntryPlugin.js'

assertNodeEnv()
markEnvAsVikePluginLoaded()

// Return as `any` to avoid Plugin type mismatches when there are multiple Vite versions installed
function plugin(vikeConfig?: ConfigVikeUserProvided): any {
  const plugins: Plugin[] = [
    resolveVikeConfig(vikeConfig), // The configResolved() hook of resolveVikeConfig() should be the first called
    ...commonConfig(),
    importUserCode(),
    ...devConfig(),
    buildConfig(),
    previewConfig(),
    ...autoFullBuild(),
    packageJsonFile(),
    removeRequireHookPlugin(),
    distFileNames(),
    ...extractAssetsPlugin(),
    extractExportNamesPlugin(),
    suppressRollupWarning(),
    setGlobalContext(),
    ...importBuild(),
    extensionsAssets(),
    baseUrls(vikeConfig),
    envVarsPlugin(),
    fileEnv(),
    ...serverEntryPlugin(vikeConfig)
  ]
  return plugins
}

// Enable `const vike = require('vike/plugin')`.
//  - This lives at the end of the file to ensure it happens after all assignments to `exports`.
//  - This is only used for the CJS build; we wrap it in a try-catch for the ESM build.
try {
  module.exports = Object.assign(exports.default, exports)
} catch {}

// Error upon wrong usage
Object.defineProperty(plugin, 'apply', {
  enumerable: true,
  get: () => {
    assertUsage(
      false,
      `Add ${pc.cyan('vike()')} instead of ${pc.cyan(
        'vike'
      )} to vite.config.js#plugins (i.e. call the function and add the return value instead of adding the function itself)`,
      { showStackTrace: true }
    )
  }
})

function assertNodeEnv() {
  const nodeEnv = getNodeEnv()
  if (nodeEnv === 'test') return
  // We should change this to be a warning if it blocks users (e.g. if a bad-citizen tool sets a wrong process.env.NODE_ENV value).
  assertUsage(
    /* We can enable this assertion after Vike's CLI is implemented and using Vite's CLI is deprecated (we can then check whether the context is a `$ vike build`).
    isNodeEnvDev() || isVikeCliBuild(),
    /*/
    isNodeEnvDev() || (true as boolean),
    ///*/
    [
      pc.cyan(`process.env.NODE_ENV === ${JSON.stringify(nodeEnv)}`),
      '(which Vike interprets as a non-development environment https://vike.dev/NODE_ENV)',
      'while the vike/plugin module is loaded.',
      vikeVitePluginLoadedInProductionError
    ].join(' ')
  )
}
