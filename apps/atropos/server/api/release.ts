export default defineCachedEventHandler(
  async (event) => {
    const { githubToken } = useRuntimeConfig(event)

    const res = await $fetch<{
      tag_name: string
      assets: { label: string; browser_download_url: string }[]
    }>(`https://api.github.com/repos/lepsehq/lepse/releases/latest`, {
      headers: {
        'User-Agent': 'lepse-ssr',
        ...(githubToken && { Authorization: `Bearer ${githubToken}` }),
      },
    })

    return {
      version: res.tag_name as string,
      assets: {
        // Windows (x64 and a64)
        'x64.exe': res.assets.find((a) => a.label.includes('x64-setup.exe'))?.browser_download_url,
        'a64.exe': res.assets.find((a) => a.label.includes('arm64-setup.exe'))
          ?.browser_download_url,
        // Fedora (x64 and a64)
        'x64.rpm': res.assets.find((a) => a.label.includes('x86_64.rpm'))?.browser_download_url,
        'a64.rpm': res.assets.find((a) => a.label.includes('aarch64.rpm'))?.browser_download_url,
        // Debian (x64 and a64)
        'x64.deb': res.assets.find((a) => a.label.includes('amd64.deb'))?.browser_download_url,
        'a64.deb': res.assets.find((a) => a.label.includes('arm64.deb'))?.browser_download_url,
        // macOS (x64 and a64)
        'x64.dmg': res.assets.find((a) => a.label.includes('x64.dmg'))?.browser_download_url,
        'a64.dmg': res.assets.find((a) => a.label.includes('aarch64.dmg'))?.browser_download_url,
      },
    }
  },
  {
    maxAge: 60 * 60 /* cached for 60m */,
    swr: true /* show stale data is ok */,
  }
)
