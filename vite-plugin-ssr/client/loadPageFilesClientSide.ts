import { getPageFilesClientSide, getExports, type PageFile, type PageContextExports } from '../shared/getPageFiles'
import { findPlusConfig } from '../shared/page-configs/findPlusConfig'
import { loadPageCode } from '../shared/page-configs/loadPageCode'
import type { PlusConfig, PlusConfigLoaded } from '../shared/page-configs/PlusConfig'

export { loadPageFilesClientSide }
export { isErrorFetchingStaticAssets }

const stamp = '__whileFetchingAssets'

async function loadPageFilesClientSide(
  pageFilesAll: PageFile[],
  plusConfigs: PlusConfig[],
  pageId: string
): Promise<PageContextExports & { _pageFilesLoaded: PageFile[] }> {
  const pageFilesClientSide = getPageFilesClientSide(pageFilesAll, pageId)
  const plusConfig = findPlusConfig(plusConfigs, pageId)
  let plusConfigLoaded: null | PlusConfigLoaded
  try {
    // prettier-ignore
    const result = await Promise.all([
      plusConfig && loadPageCode(plusConfig, import.meta.env.DEV),
      ...pageFilesClientSide.map((p) => p.loadFile?.()),
    ])
    plusConfigLoaded = result[0]
  } catch (err: any) {
    // To trigger this catch: add `throw new Error()` in the global scope of +onRenderClient.js
    if (isFetchError(err)) {
      Object.assign(err, { [stamp]: true })
    }
    throw err
  }
  const { config, configEntries, exports, exportsAll, pageExports } = getExports(pageFilesClientSide, plusConfigLoaded)
  const pageContextAddendum = {
    config,
    configEntries,
    exports,
    exportsAll,
    pageExports,
    _pageFilesLoaded: pageFilesClientSide
  }
  return pageContextAddendum
}

function isErrorFetchingStaticAssets(err: unknown) {
  if (!err) {
    return false
  }
  return (err as any)[stamp] === true
}

// https://stackoverflow.com/questions/75928310/how-to-detect-that-import-some-url-failed-because-some-url-isnt-a-javasc
function isFetchError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  // https://github.com/stacks-network/clarity-js-sdk/blob/e757666b59af00b5db04dd1bf0df016e3a459ea2/packages/clarity/src/providers/registry.ts#L40-L45
  // https://github.com/modernweb-dev/web/blob/0a59b56e4c1b50af81fbf4588f36a1ceb71f3976/integration/test-runner/tests/test-failure/runTestFailureTest.ts#L11-L18
  const FAILED_TO_FETCH_MESSAGES = [
    // chromium
    'Failed to fetch dynamically imported module',
    // firefox
    'error loading dynamically imported module',
    // safari
    'Importing a module script failed',
    // ??
    'error resolving module specifier',
    // ??
    'failed to resolve module'
  ]
  return FAILED_TO_FETCH_MESSAGES.some((s) => err.message.toLowerCase().includes(s.toLowerCase()))
}