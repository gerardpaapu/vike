import type { ModuleNode, ResolvedUrl } from 'vite'
import type { FetchResult } from 'vite/runtime'
import type { ConfigVikeResolved } from '../../shared/ConfigVike.js'

export type ClientFunctions = {
  deleteByModuleId(modulePath: string): boolean
  start(options: {
    viteMiddlewareProxyPort: number
    entry: string
    viteConfig: {
      root: string
      configVikePromise: ConfigVikeResolved
    }
  }): Promise<void>
  invalidateDepTree(ids: string[]): boolean
}

type MinimalModuleNode = Pick<ModuleNode, 'id' | 'url' | 'type'>
type MinimalModuleNodeWithImportedModules = MinimalModuleNode & { importedModules: Set<MinimalModuleNode> }
export type ServerFunctions = {
  fetchModule(id: string, importer?: string): Promise<FetchResult>
  moduleGraphResolveUrl(url: string): Promise<ResolvedUrl>
  moduleGraphGetModuleById(id: string): MinimalModuleNodeWithImportedModules | undefined
  transformIndexHtml(url: string, html: string, originalUrl?: string): Promise<string>
}
