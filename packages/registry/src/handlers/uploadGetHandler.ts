import {Handler} from "./Handler";

export const uploadGetHandler: Handler = async (params, resolve) => {
    resolve(`<html>

<style>
html,body{
    font-family : Arial;
    display:flex;
    flex-direction:column;
    height: 100%;
    overflow:auto;
}
body {
    background-color: #f2f2f2
}
</style>
<body>
<div style="display:flex;flex-direction:column;max-width:800px;margin:auto;background-color:white;padding:20px;height:100%;width:100%;overflow:auto">
<h1>Register Module</h1>
<p>Please choose the modules you want to upload to the registry server and then click the "Submit" button. The server will reply if the modules were saved successfully or if there was dependency error.</p>
<input id="inputUpload" type="file" multiple accept="text/html" >
<div id="summary" style="margin-top:10px;display:flex;flex-direction:column"></div>
<div id="serverResponse" style="margin-top:10px;display:flex;flex-direction:column"></div>
</div>
</body>
<script>
    window.onload = () => {
        
        const input = document.getElementById('inputUpload');
        
        input.addEventListener('change',async (event) => {
            const files = input.files;
            const {contents,errors} = await validateModules(files);
            const summary = document.getElementById('summary');
            const serverResponse = document.getElementById('serverResponse');
            serverResponse.innerHTML = '';
            if(errors.length > 0){
                summary.innerHTML = errors.join('')
                return;
            }
            
            const modules = Array.from(files).map((file, index) => {
                const content = contents[index];
                const moduleName = getMetaData('module', content)[0];
                const dependency = getMetaData('dependency', content)[0];
                const description = getMetaData('description', content)[0];
                const author = getMetaData('author', content)[0];
                const [path, version] = moduleName.split('@');
                // maybe we need to have the available queryParams and available service
                const module = {
                    name: moduleName,
                    path,
                    version,
                    dependencies: (dependency || '').split(',').filter(s => s).map(s => s.trim()),
                    missingDependencies: [],
                    srcdoc: content,
                    installedOn: new Date().getTime(),
                    size: file.size,
                    lastModified: file.lastModified,
                    author,
                    description,
                    active: true,
                    deleted: false
                }
                return module;
            });
            
            const content = modules.map(module => {
                const result = [];
                result.push('<tr>')
                result.push('<td style="border-bottom:1px solid rgba(0,0,0,0.1)">')
                result.push(module.name)
                result.push('</td>')
                result.push('<td style="border-bottom:1px solid rgba(0,0,0,0.1)">')
                result.push(module.description)
                result.push('</td>')
                result.push('<td style="border-bottom:1px solid rgba(0,0,0,0.1)">')
                result.push(module.dependencies)
                result.push('</td>')
                result.push('<td style="border-bottom:1px solid rgba(0,0,0,0.1)">')
                result.push(module.author)
                result.push('</td>')
                result.push('</tr>')
                return result.join('')
            }).join('');
            
            const table = [];
            table.push('<table><thead><tr>');
            table.push('<th style="border-bottom:1px solid rgba(0,0,0,0.1);text-align:left">Name</th>');
            table.push('<th style="border-bottom:1px solid rgba(0,0,0,0.1);text-align:left">Description</th>');
            table.push('<th style="border-bottom:1px solid rgba(0,0,0,0.1);text-align:left">Dependencies</th>');
            table.push('<th style="border-bottom:1px solid rgba(0,0,0,0.1);text-align:left">Author</th>');
            table.push('</tr></thead><tbody>');
            table.push(content);
            table.push('</tbody></table>');
            table.push('<div><button id="submitButton" style="margin-top:10px;border:1px solid rgba(0,0,0,0.1);padding:5px 10px;background-color:f2f2f2;border-radius:10px;font-size:16px">Submit</button></div>')
            summary.innerHTML = table.join('');
            const submitButton = document.getElementById('submitButton');
            submitButton.addEventListener('click',async () => {
                const response = await fetch('upload',{
                    method : 'POST',
                    headers : {
                        'Accept' : 'application/json',
                        'Content-Type' : 'application/json'
                    },
                    body : JSON.stringify(modules)
                });
                const data = await response.json();
                if(data.error){
                    const error = [];
                    error.push('<h3>Module Registration rejected due missing dependency</h3>');
                    error.push('<table><thead><tr>');
                    error.push('<th style="text-align:left;border-bottom:1px solid rgba(0,0,0,0.1)">Name</th>');
                    error.push('<th style="text-align:left;border-bottom:1px solid rgba(0,0,0,0.1)">Dependencies that does not exist</th>');
                    error.push('</tr></thead><tbody>');
                    data.error.forEach(err => {
                        error.push('<td style="border-bottom:1px solid rgba(0,0,0,0.1)">'+err.module+'</td>')
                        error.push('<td style="border-bottom:1px solid rgba(0,0,0,0.1)">'+err.missingDependencies.join(\',\')+'</td>')    
                    });
                    
                    error.push('</tbody></table>');
                    serverResponse.innerHTML = error.join('')
                    
                }else{
                    serverResponse.innerHTML = '<h3>Modules have been uploaded without any problems.</h3>'
                }
                
            })
        })
    }
    
    async function validateModules(files) {
        const contents = await Promise.all(Array.from(files).map(file => readFile(file)));
        const errors = Array.from(files).map((file, index) => {
            const content = contents[index];
            const missingRequiredMeta = [];
            const versioningIssue = [];
            const moduleName = getMetaData('module', content)[0];
            const dependency = getMetaData('dependency', content)[0];
            const description = getMetaData('description', content)[0];
            const authorName = getMetaData('author', content)[0];
            validate(moduleName, missingRequiredMeta, 'module');
            validate(description, missingRequiredMeta, 'description');
            validate(authorName, missingRequiredMeta, 'author');
            validateVersioning(moduleName || '', versioningIssue, moduleName+'(module)');
            if (dependency) {
                const dependencies = dependency.split(',').filter(s => s).map(s => s.trim());
                dependencies.forEach(dep => {
                    validateVersioning(dep, versioningIssue, dep.toString())
                })
            }
            const errors = [];
            if (missingRequiredMeta.length > 0) {
                errors.push('Missing '+missingRequiredMeta.map(meta => '<span style="font-weight: bold;margin:0 5px">"'+meta+'"</span>').join(', '))
            }
            if (versioningIssue.length > 0) {
                errors.push('Version error '+versioningIssue.map(version => '<span style="font-weight: bold;margin:0 5px">"'+version+'"</span>').join(', '))
            }
            if (errors.length > 0) {
                return '<div style="flex-direction: row;flex-wrap: wrap;margin-bottom: 10px">'+file.name + ' : ' + errors.join(' ')+'</div>'
            }
            return ''
        }).filter(s => s);
        return {contents, errors};
    }
    
    
    function readFile(file){
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', async (event) => {
                if(event && event.target && event.target.result){
                    resolve(event.target.result.toString() || '');    
                }else{
                    resolve('');
                }
            });
            reader.readAsText(file, 'utf-8');
        })
    }
    
    
    function getMetaData(metaName, htmlText){
        const result = [];
        let index = 0;
        do {
            const [value, endIndex] = scanText(metaName, htmlText, index);
            index = endIndex;
            if (value) {
                result.push(value);
            }
        } while (index >= 0);
        return result;
    }
    
    function scanText(metaName, htmlText, startingIndex){
        const indexOfContent = htmlText.indexOf('name="'+metaName+'"', startingIndex);
        if (indexOfContent < 0) {
            return ['', -1];
        }
        const startTagIndex = htmlText.substring(startingIndex, indexOfContent).lastIndexOf('<') + startingIndex;
        const endTagIndex = htmlText.substring(indexOfContent, htmlText.length).indexOf('>') + indexOfContent
        let dependency = '';
        if (startTagIndex >= 0 && endTagIndex > startTagIndex) {
            dependency = htmlText.substring(startTagIndex, endTagIndex).split('content="')[1].split('"')[0];
        }
        return [dependency, endTagIndex];
    }

    const validate = (value, errors, message) => (value === undefined || value === null || value === '') && errors.push(message)
    const versionIsValid = (version) => version.split('.').reduce((isNumber, number) => parseInt(number) >= 0 && isNumber, true)
    const validateVersioning = (value, errors, message) => ((value.split('@').filter(s => s).length !== 2) || (!versionIsValid(value.split('@')[1]))) && errors.push(message);

    
</script>
</html>`)
}