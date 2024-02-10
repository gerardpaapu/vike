export { build }

async function build() {
  const { default: pc } = await import('@brillout/picocolors')
  const { build: buildVite } = await import('vite')
  const { resolveConfig, isCliCall } = await import('./utils.js')
  const { viteConfig, vikeConfigResolved, viteConfigResolved: resolvedConfig } = await resolveConfig({}, 'build')

  const clientOutput = await buildVite(viteConfig).catch((error) => {
    if (!isCliCall) {
      throw error
    }
    resolvedConfig.logger.error(pc.red(`error during build:\n${error.stack}`), { error })
    process.exit(1)
  })

  const serverOutput = await buildVite({
    ...viteConfig,
    build: {
      ...viteConfig.build,
      ssr: true
    }
  }).catch((error) => {
    if (!isCliCall) {
      throw error
    }
    resolvedConfig.logger.error(pc.red(`error during build:\n${error.stack}`), { error })
    process.exit(1)
  })

  if (!vikeConfigResolved.prerender) {
    return { clientOutput, serverOutput }
  }

  const { _prerender } = await import('./prerender.js')
  await _prerender({
    viteConfig
  })

  return { clientOutput, serverOutput }
}
