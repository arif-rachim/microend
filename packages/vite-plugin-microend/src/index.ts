import {Plugin, UserConfig} from "vite"
import {OutputAsset, OutputChunk, OutputOptions} from "rollup"
import {load} from "cheerio";
import {encodeFromFile} from "./image-data-uri";


export interface Config {
    title: string,
    name: string,
    version: string,
    description: string,
    author: string,
    dependencies: { [k: string]: string },
    iconFile: string;
    visibleInHomeScreen: boolean;
}

export interface PwaConfig {
    title: string,
    description: string,
    favIcon: string;
    favIcon32: string;
    favIcon16: string;
    maskIcon: string;
    socialLogo: string;
    icon180: string;
    icon192: string;
    icon512: string;
    origin: string;
}


const defaultConfig = {useRecommendedBuildConfig: true, removeViteModuleLoader: false, deleteInlinedFiles: true}

function replaceScript(html: string, scriptFilename: string, scriptCode: string, removeViteModuleLoader = false): string {
    const reScript = new RegExp(`<script([^>]*?) src="[./]*${scriptFilename}"([^>]*)></script>`)
    // we can't use String.prototype.replaceAll since it isn't supported in Node.JS 14
    const preloadMarker = /"__VITE_PRELOAD__"/g
    const newCode = scriptCode.replace(preloadMarker, "void 0")
    const inlined = html.replace(reScript, (_, beforeSrc, afterSrc) => `<script${beforeSrc}${afterSrc}>\n${newCode}\n</script>`)
    return removeViteModuleLoader ? _removeViteModuleLoader(inlined) : inlined
}

function replaceCss(html: string, scriptFilename: string, scriptCode: string): string {
    const reCss = new RegExp(`<link[^>]*? href="[./]*${scriptFilename}"[^>]*?>`)
    return html.replace(reCss, `<style>\n${scriptCode}\n</style>`)
}

const warnNotInlined = (filename: string) => console.warn(`WARNING: asset not inlined: ${filename}`)

async function replaceMicroEndConfig(replacedHtml: string, config: Config) {
    const $ = load(replacedHtml);
    const head = $('head');
    $('title').remove();
    $('meta[name="name"]').remove();
    $('meta[name="dependencies"]').remove();
    $('meta[name="description"]').remove();
    $('meta[name="author"]').remove();
    $('meta[name="visibleInHomeScreen"]').remove();
    $('link[type="image/x-icon"]').remove();
    const dependencies = Object.keys(config.dependencies).map(key => {
        return `${key}@${config.dependencies[key]}`
    }).join(',')
    const iconDataURI = await encodeFromFile(config.iconFile);
    head.append(`<title>${config.title}</title>`);
    head.append(`<meta content="${config.name}@${config.version}" name="name">`);
    head.append(`<meta content="${dependencies}" name="dependencies">`);
    head.append(`<meta content="${config.description}" name="description">`);
    head.append(`<meta content="${config.author}" name="author">`);
    head.append(`<meta content="${config.visibleInHomeScreen}" name="visibleInHomeScreen">`);
    head.append(`<link href="${iconDataURI}" rel="icon" type="image/x-icon">`);
    return $.html();
}

async function prepareManifest(config: PwaConfig) {
    const manifest = {
        "name": config.title,
        "short_name": config.title,
        "start_url": config.origin,
        "display": "fullscreen",
        "background_color": "#f8f8f8",
        "lang": "en",
        "scope": "/",
        "description": config.description,
        "theme_color": "#f8f8f8",
        "orientation": "portrait",
        "icons": [
            {
                "src": await encodeFromFile(config.icon192),
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": await encodeFromFile(config.icon512),
                "sizes": "512x512",
                "type": "image/png"
            },
            {
                "src": await encodeFromFile(config.icon512),
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any maskable"
            }
        ]
    }

    return JSON.stringify(manifest)
}

async function microEndPWA(replacedHtml: string, config: PwaConfig) {
    const $ = load(replacedHtml);
    const head = $('head');
    $('link[rel="apple-touch-icon"]').remove();
    $('link[type="image/x-icon"]').remove();
    $('link[sizes="32x32"]').remove();
    $('link[sizes="16x16"]').remove();
    $('link[rel="mask-icon"]').remove();
    $('meta[property="og:image"]').remove();

    const appleTouchIcon = await encodeFromFile(config.icon180);
    const favIcon = await encodeFromFile(config.favIcon)
    const favIcon16 = await encodeFromFile(config.favIcon16)
    const favIcon32 = await encodeFromFile(config.favIcon32);
    const maskIcon = await encodeFromFile(config.maskIcon);
    const socialImage = await encodeFromFile(config.socialLogo);
    const manifest = new Buffer(await prepareManifest(config));

    head.append(`<meta content="${socialImage}" property="og:image">`);
    head.append(`<link href="${maskIcon}" rel="mask-icon" color="#5bbad5" >`);
    head.append(`<link href="${favIcon32}" rel="icon" sizes="32x32" type="image/png">`);
    head.append(`<link href="${favIcon16}" rel="icon" sizes="16x16" type="image/png">`);
    head.append(`<link href="${favIcon}" rel="icon" type="image/x-icon">`);
    head.append(`<link href="${appleTouchIcon}" rel="apple-touch-icon" sizes="180x180">`);
    head.append(`<link rel="manifest" href='data:application/manifest+json;base64,${manifest.toString('base64')}' >`);
    return $.html();
}


export function viteMicroEnd(config: Config): Plugin {
    const {removeViteModuleLoader, deleteInlinedFiles} = defaultConfig;
    return {
        name: "vite:microend",
        config: _useRecommendedBuildConfig,
        enforce: "post",
        generateBundle: async (_, bundle) => {
            const jsExtensionTest = /\.[mc]?js$/
            const htmlFiles = Object.keys(bundle).filter((i) => i.endsWith(".html"))
            const cssAssets = Object.keys(bundle).filter((i) => i.endsWith(".css"))
            const jsAssets = Object.keys(bundle).filter((i) => jsExtensionTest.test(i))
            const bundlesToDelete = [] as string[]
            for (const name of htmlFiles) {
                const htmlChunk = bundle[name] as OutputAsset
                let replacedHtml = htmlChunk.source as string
                replacedHtml = await replaceMicroEndConfig(replacedHtml, config)
                for (const jsName of jsAssets) {
                    const jsChunk = bundle[jsName] as OutputChunk
                    if (jsChunk.code != null) {
                        bundlesToDelete.push(jsName)
                        replacedHtml = replaceScript(replacedHtml, jsChunk.fileName, jsChunk.code, removeViteModuleLoader)
                    }
                }
                for (const cssName of cssAssets) {
                    const cssChunk = bundle[cssName] as OutputAsset
                    bundlesToDelete.push(cssName)
                    replacedHtml = replaceCss(replacedHtml, cssChunk.fileName, cssChunk.source as string)
                }

                htmlChunk.source = replacedHtml
            }
            if (deleteInlinedFiles) {
                for (const name of bundlesToDelete) {
                    delete bundle[name]
                }
            }
            for (const name of Object.keys(bundle).filter((i) => !jsExtensionTest.test(i) && !i.endsWith(".css") && !i.endsWith(".html"))) {
                warnNotInlined(name)
            }
        }
    }
}

export function viteMicroEndPWA(config: PwaConfig): Plugin {
    const {removeViteModuleLoader, deleteInlinedFiles} = defaultConfig;

    return {
        name: "vite:microend-pwa",
        config: _useRecommendedBuildConfig,
        enforce: "post",
        generateBundle: async (_, bundle) => {
            const jsExtensionTest = /\.[mc]?js$/
            const htmlFiles = Object.keys(bundle).filter((i) => i.endsWith(".html"))
            const bundlesToDelete = [] as string[]
            for (const name of htmlFiles) {
                const htmlChunk = bundle[name] as OutputAsset
                let replacedHtml = htmlChunk.source as string
                replacedHtml = await microEndPWA(replacedHtml, config);
                htmlChunk.source = replacedHtml
            }
            if (deleteInlinedFiles) {
                for (const name of bundlesToDelete) {
                    delete bundle[name]
                }
            }
            for (const name of Object.keys(bundle).filter((i) => !jsExtensionTest.test(i) && !i.endsWith(".css") && !i.endsWith(".html"))) {
                warnNotInlined(name)
            }
        }
    }
}

const _removeViteModuleLoader = (html: string) => html.replace(/(<script type="module" crossorigin>\s*)\(function\(\)\{[\s\S]*?\}\)\(\);/, '<script type="module">\n')

// Modifies the Vite build config to make this plugin work well.
const _useRecommendedBuildConfig = (config: UserConfig) => {
    if (!config.build) config.build = {}
    // Ensures that even very large assets are inlined in your JavaScript.
    config.build.assetsInlineLimit = 100000000
    // Avoid warnings about large chunks.
    config.build.chunkSizeWarningLimit = 100000000
    // Emit all CSS as a single file
    config.build.cssCodeSplit = false
    // Avoids the extra step of testing Brotli compression, which isn't really pertinent to a file served locally.
    config.build.reportCompressedSize = false
    // Subfolder bases are not supported, and shouldn't be needed because we're embedding everything.
    config.base = undefined

    if (!config.build.rollupOptions) config.build.rollupOptions = {}
    if (!config.build.rollupOptions.output) config.build.rollupOptions.output = {}

    const updateOutputOptions = (out: OutputOptions) => {
        // Ensure that as many resources as possible are inlined.
        out.inlineDynamicImports = true
    }

    if (Array.isArray(config.build.rollupOptions.output)) {
        for (const o in config.build.rollupOptions.output) updateOutputOptions(o as OutputOptions)
    } else {
        updateOutputOptions(config.build.rollupOptions.output as OutputOptions)
    }
}