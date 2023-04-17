const { promises: fs } = require("fs")
const path = require("path")
const dir = path.dirname;
async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    let entries = await fs.readdir(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        entry.isDirectory() ?
            await copyDir(srcPath, destPath) :
            await fs.copyFile(srcPath, destPath);
    }
}
const sourceDir = path.join(dir(__dirname),'core','dist');
const targetDir = path.join(__dirname,'src','app');
copyDir(sourceDir,targetDir).then();
console.log('Copy app complete');