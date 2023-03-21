import {Plugin, UserConfig} from "vite"
import {OutputAsset, OutputChunk, OutputOptions} from "rollup"
import {load} from "cheerio";
import {encodeFromFile} from "./image-data-uri";

/**
 * <meta content="fault@0.0.3" name="module">
 *     <meta content="identity@0.0.2" name="dependency">
 *     <meta content="Fault management component" name="description">
 *     <meta content="a.arif.r@gmail.com" name="author">
 */
export type Config = {
    title: string,
    name: string,
    version: string,
    description: string,
    author: string,
    dependencies: { [k: string]: string },
    iconFile: string;
    visibleInHomeScreen: boolean;
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
    const inlined = html.replace(reCss, `<style>\n${scriptCode}\n</style>`)
    return inlined
}

const warnNotInlined = (filename: string) => console.warn(`WARNING: asset not inlined: ${filename}`)

async function replaceMicroEndConfig(replacedHtml: string, config: Config) {
    const $ = load(replacedHtml);
    const head = $('head');
    $('title').remove();
    $('meta[name="module"]').remove();
    $('meta[name="dependency"]').remove();
    $('meta[name="description"]').remove();
    $('meta[name="author"]').remove();
    $('meta[name="icon"]').remove();
    $('meta[name="visibleInHomeScreen"]').remove();
    const dependencies = Object.keys(config.dependencies).map(key => {
        return `${key}@${config.dependencies[key]}`
    }).join(',')
    const iconDataUri = await encodeFromFile(config.iconFile);
    head.prepend(`
        <title>${config.title}</title>
        <meta content="${config.name}@${config.version}" name="module">
        <meta content="${dependencies}" name="dependency">
        <meta content="${config.description}" name="description">
        <meta content="${config.author}" name="author">
        <meta content="${iconDataUri}" name="icon">
        <meta content="${config.visibleInHomeScreen}" name="visibleInHomeScreen">
    `)
    return $.html();
}


export function viteMicroEnd(config: Config): Plugin {
    const {removeViteModuleLoader, deleteInlinedFiles} = defaultConfig;
    return {
        name: "vite:singlefile",
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
        },
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