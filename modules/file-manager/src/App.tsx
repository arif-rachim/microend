import {db, FileBuffer, FileOrFolder, root} from "./Database";
import {
    Dispatch,
    ForwardedRef,
    forwardRef, RefObject,
    SetStateAction,
    useEffect,
    useImperativeHandle,
    useRef,
    useState
} from "react";
import {
    IoAddCircleOutline,
    IoCheckmarkCircle,
    IoChevronForward,
    IoDocument,
    IoFolderOutline,
    IoTrashOutline
} from "react-icons/io5";
import {nanoid} from "nanoid";
import {BiRename} from "react-icons/bi";
import {FactoryFunction, FactoryFunctionConfig, useSlidePanel, Visible} from "@microend/utils";


async function populateTestData() {
    const folderOne: FileOrFolder = {name: 'folder-one', id: 'folder-one', parentId: root.id};
    const folderTwo: FileOrFolder = {name: 'Notifications', id: 'folder-two', parentId: root.id};
    const folderOneOne: FileOrFolder = {name: 'folder-one-one', id: 'folder-one-one', parentId: folderOne.id};
    const folderOneTwo: FileOrFolder = {name: 'folder-one-two', id: 'folder-one-two', parentId: folderOne.id};
    const folderTwoOne: FileOrFolder = {name: 'folder-two-one', id: 'folder-two-one', parentId: folderTwo.id};
    const folderTwoTwo: FileOrFolder = {name: 'folder-two-two', id: 'folder-two-two', parentId: folderTwo.id};
    const fileOneOneOne: FileOrFolder = {
        name: 'file-one-one-one',
        id: 'file-one-one-one',
        parentId: folderOneOne.id,
        isFile: true
    };

    const fileOneOneTwo: FileOrFolder = {
        name: 'file-one-one-two',
        id: 'file-one-one-two',
        parentId: folderOneOne.id,
        isFile: true
    };

    const fileOrFolders: FileOrFolder[] = [
        folderOne,
        folderTwo,
        folderOneOne,
        folderOneTwo,
        folderTwoOne,
        folderTwoTwo,
        fileOneOneOne,
        fileOneOneTwo
    ]

    for (const fileOrFolder of fileOrFolders) {
        // this is the db folder or files
        await db.folderOrFiles.put(fileOrFolder);
    }
}

async function initiateDatabase() {
    const rootData = await db.folderOrFiles.get(root.id);
    if (rootData === undefined) {
        // lets inject root data here
        await db.folderOrFiles.put(root);
        // note this will be removed after development done
        await populateTestData();
    }
}

initiateDatabase().then();

async function directoryChainFromRoot(directory: FileOrFolder): Promise<FileOrFolder[]> {
    const result: FileOrFolder[] = [directory];
    if (directory.parentId) {
        const parent = await db.folderOrFiles.get(directory.parentId);
        if (parent) {
            const chainFromRoot = await directoryChainFromRoot(parent);
            result.unshift(...chainFromRoot);
        }
    }
    return result;
}

function DirectoryToPath(props: { value: FileOrFolder, onChange: (value: FileOrFolder) => void }) {
    const [directoryChain, setDirectoryChain] = useState<FileOrFolder[]>([]);
    const currentDirectory = props.value;
    useEffect(() => {
        (async () => {
            const directoryChain = await directoryChainFromRoot(currentDirectory);
            setDirectoryChain(directoryChain)
        })();

    }, [currentDirectory])

    return <div style={{display: 'flex', flexDirection: "row", flexWrap: 'wrap'}}>
        {directoryChain.map(file => {
            return <div key={file.id} style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '3px 3px 3px 0px'
            }}
                        onClick={() => props.onChange(file)}>
                <IoChevronForward style={{marginRight: 3}}/>
                <div style={{textDecoration: 'underline', fontSize: 16}}>{file.name}</div>
            </div>
        })}
    </div>
}

function Toolbar<T>(props: {
    currentDirectory: FileOrFolder,
    setCurrentDirectory: Dispatch<SetStateAction<FileOrFolder>>,
    editMode: boolean,
    folderFilesRef: RefObject<{ addFolder: () => Promise<FileOrFolder>; refresh: () => Promise<void> }>,
    setSelectedFileOrFolders: Dispatch<SetStateAction<FileOrFolder[]>>, setEditMode: Dispatch<SetStateAction<boolean>>,
    onRename: () => Promise<void>, showPanel: <T>(factory: FactoryFunction<T>, config?: (FactoryFunctionConfig | undefined)) => Promise<T>, onDeleteFiles: () => Promise<void>, selectedFileOrFoldersMultiple: boolean
}) {
    const {
        editMode,
        setEditMode,
        setSelectedFileOrFolders,
        folderFilesRef,
        selectedFileOrFoldersMultiple,
        onDeleteFiles,
        setCurrentDirectory,
        currentDirectory,
        onRename,
        showPanel
    } = props;

    return <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: 800,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        boxShadow: '0 5px 5px -3px rgba(0,0,0,0.1)',
    }}>
        <div style={{fontSize: 16, borderBottom: '1px solid rgba(0,0,0,0.1)', padding: 5}}>
            <DirectoryToPath value={currentDirectory} onChange={(value) => setCurrentDirectory(value)}/>
        </div>
        <div style={{
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            padding: 5,
            display: 'flex',
            flexDirection: 'row'
        }}>
            <Visible if={!editMode}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    border: '1px solid rgba(0,0,0,0.1)',
                    padding: '3px 5px',
                    borderRadius: 3,
                    marginRight: 5
                }} onClick={async (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    const folder = await folderFilesRef?.current?.addFolder()!;
                    setSelectedFileOrFolders([folder]);
                    setEditMode(true);
                    setTimeout(() => {
                        onRename();
                    }, 100);

                }}>
                    <IoFolderOutline style={{fontSize: 28, marginRight: 5}}/>
                    <div>Create Folder</div>
                </div>
                <label style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    border: '1px solid rgba(0,0,0,0.1)',
                    padding: '3px 5px',
                    borderRadius: 3
                }}>
                    <IoAddCircleOutline style={{fontSize: 28, marginRight: 5}}/>
                    <div>Upload File</div>
                    <input type={"file"} multiple style={{display: 'none'}}
                           onChange={async (event) => {
                               const input = event.target as HTMLInputElement;
                               if (input.files === null) {
                                   return;
                               }
                               const files: FileList = input.files;
                               for (let i = 0; i < files.length; i++) {
                                   const file = files[i];
                                   const {buffer, type} = await blobToArrayBuffer(file);
                                   const fileData: FileOrFolder = {
                                       name: file.name,
                                       id: nanoid(),
                                       isFile: true,
                                       type: type,
                                       parentId: currentDirectory.id
                                   };
                                   const bufferData: FileBuffer = {
                                       id: fileData.id,
                                       buffer: buffer
                                   };
                                   await db.folderOrFiles.put(fileData);
                                   await db.fileBuffer.put(bufferData);
                               }
                               await showPanel(closePanel => {
                                   return <div
                                       style={{display: 'flex', flexDirection: 'column', alignItems: "center"}}>
                                       <div style={{
                                           display: 'flex',
                                           flexDirection: 'column',
                                           width: '100%',
                                           maxWidth: 800,
                                           backgroundColor: 'white',
                                           padding: 10
                                       }}>
                                           <div style={{fontSize: 18}}>File(s) were successfully saved</div>
                                           <div>
                                               <button onClick={() => {
                                                   closePanel('Ok');
                                               }}>Ok
                                               </button>
                                           </div>
                                       </div>
                                   </div>
                               });
                               folderFilesRef?.current?.refresh();

                           }}/>
                </label>
            </Visible>
            <Visible if={editMode}>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    border: '1px solid rgba(0,0,0,0.1)',
                    padding: '3px 5px',
                    borderRadius: 3,
                    marginRight: 5
                }} onPointerDown={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    await onDeleteFiles();
                }}>
                    <IoTrashOutline style={{fontSize: 28, marginRight: 5}}/>
                    <div>Delete</div>
                </div>

                <Visible if={!selectedFileOrFoldersMultiple}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        border: '1px solid rgba(0,0,0,0.1)',
                        padding: '3px 5px',
                        borderRadius: 3,
                        marginRight: 5
                    }} onPointerDown={async (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        await onRename()
                    }}>
                        <BiRename style={{fontSize: 28, marginRight: 5}}/>
                        <div>Rename</div>
                    </div>
                </Visible>
            </Visible>
        </div>
    </div>;
}

export function App() {
    const [currentDirectory, setCurrentDirectory] = useState<FileOrFolder>(root);
    const folderFilesRef = useRef<{ addFolder: () => Promise<FileOrFolder>, refresh: () => Promise<void> }>(null);
    const [editMode, setEditMode] = useState(false);
    const [selectedFileOrFolders, setSelectedFileOrFolders] = useState<FileOrFolder[]>([]);
    const selectedFileOrFoldersMultiple = selectedFileOrFolders.length > 1;
    const [showPanel, SlidePanel] = useSlidePanel();
    const selectedFileOrFolderRef = useRef({selectedFileOrFolders});
    selectedFileOrFolderRef.current = {selectedFileOrFolders}

    async function onDeleteFiles() {

        const deleteFiles = await showPanel(closePanel => {
            return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}
                        onPointerDown={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                        }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: 800,
                    backgroundColor: '#FFF',
                    padding: 10
                }}>
                    <div>Are you sure you want to delete these folder / files</div>
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <button style={{flexGrow: 1, marginRight: 5}}
                                onClick={() => closePanel(true)}
                        >Yes
                        </button>
                        <button style={{flexGrow: 1}} onClick={() => closePanel(false)}>No</button>
                    </div>
                </div>
            </div>
        });
        if (deleteFiles) {
            for (const fileOrFolder of selectedFileOrFolders) {
                await db.folderOrFiles.delete(fileOrFolder.id);
            }
            setSelectedFileOrFolders([]);
            setEditMode(false);
            await folderFilesRef?.current?.refresh();
        }
    }

    async function onRename() {
        const fileOrFolder = selectedFileOrFolderRef.current.selectedFileOrFolders[0];
        const newName = await showPanel<string | false>(closePanel => {

            return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}
                        onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                        }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: 800,
                    backgroundColor: '#fff',
                    padding: 10
                }}>
                    <div>New Name</div>
                    <input type="text" style={{marginBottom: 10}} autoFocus={true}
                           defaultValue={fileOrFolder?.name} id={'folder-rename-input'}/>
                    <div style={{display: 'flex'}}>
                        <button onClick={() => {
                            const input: HTMLElement = document.getElementById('folder-rename-input')!;
                            if (input instanceof HTMLInputElement) {
                                closePanel(input.value);
                            }
                        }} style={{flexGrow: 1, marginRight: 10}}>Save
                        </button>
                        <button onClick={() => {
                            closePanel(false);
                        }} style={{flexGrow: 1}}>Cancel
                        </button>
                    </div>
                </div>
            </div>
        });
        if (newName === false) {
            return;
        }
        await db.folderOrFiles.update(fileOrFolder.id, {name: newName});
        await folderFilesRef?.current?.refresh();
        setSelectedFileOrFolders([]);
        setEditMode(false);
    }

    return <div style={{

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <div style={{
            background: '#fff',
            width: '100%',
            maxWidth: 800,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Toolbar currentDirectory={currentDirectory} setCurrentDirectory={setCurrentDirectory} editMode={editMode}
                     folderFilesRef={folderFilesRef}
                     setSelectedFileOrFolders={setSelectedFileOrFolders} setEditMode={setEditMode} onRename={onRename}
                     showPanel={showPanel} onDeleteFiles={onDeleteFiles}
                     selectedFileOrFoldersMultiple={selectedFileOrFoldersMultiple}/>
            <FoldersAndFiles ref={folderFilesRef} value={currentDirectory}
                             editMode={editMode}
                             setEditMode={setEditMode}
                             selectedFileOrFolders={selectedFileOrFolders}
                             setSelectedFileOrFolders={setSelectedFileOrFolders}
                             onChange={async (value: FileOrFolder) => {
                                 if (value.isFile === true) {
                                     // we need to find an opener if this is pdf then we can just render it here
                                     const buffer = await db.fileBuffer.get(value.id);
                                     if (buffer === undefined) {
                                         return;
                                     }
                                     const blob = arrayBufferToBlob({buffer: buffer.buffer, type: value.type!});
                                     const objectUrl = URL.createObjectURL(blob);
                                     await showPanel(closePanel => {
                                         return <div
                                             style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                             <div style={{
                                                 display: 'flex',
                                                 flexDirection: 'column',
                                                 width: '100%',
                                                 maxWidth: 800,
                                                 padding: 10,
                                                 backgroundColor: 'white'
                                             }}>
                                                 <iframe src={objectUrl} style={{
                                                     display: 'flex',
                                                     flexDirection: 'column',
                                                     height: window.innerHeight - 100,
                                                     marginBottom: 10
                                                 }}></iframe>
                                                 <button style={{borderRadius: 5}} onClick={() => {
                                                     closePanel('ok');
                                                 }}>Ok
                                                 </button>
                                             </div>
                                         </div>
                                     });
                                 } else {
                                     setCurrentDirectory(value);
                                 }
                             }}
            />
        </div>
        {SlidePanel}
    </div>
}

function onTouchStart(props: {
    eventName: string,
    onChange: (value: FileOrFolder) => void,
    fileOrFolder: FileOrFolder,
    setEditMode: (value: boolean) => void,
    editMode: boolean,
    setSelectedFileOrFolder: Dispatch<SetStateAction<FileOrFolder[]>>
}) {

    const {editMode, setSelectedFileOrFolder, fileOrFolder, setEditMode, eventName, onChange} = props;

    if (editMode) {
        setSelectedFileOrFolder(fileOrFolders => {
            const currentIndex = fileOrFolders.findIndex(f => f.id === fileOrFolder.id);
            if (currentIndex >= 0) {
                fileOrFolders = fileOrFolders.filter(f => f.id !== fileOrFolder.id);
            } else {
                fileOrFolders = [...fileOrFolders, fileOrFolder]
            }
            return fileOrFolders;
        })
        return;
    }
    const timeout = setTimeout(() => {
        window.removeEventListener(eventName, onEnd);
        setEditMode(true);
        setSelectedFileOrFolder([fileOrFolder])
    }, 300)

    function onEnd() {
        clearTimeout(timeout);
        onChange(fileOrFolder);
        window.removeEventListener(eventName, onEnd);
    }

    window.addEventListener(eventName, onEnd);
}

const FoldersAndFiles = forwardRef(function FoldersAndFiles(props: {
    value: FileOrFolder,
    onChange: (value: FileOrFolder) => void,
    editMode: boolean,
    setEditMode: (value: boolean) => void
    selectedFileOrFolders: FileOrFolder[],
    setSelectedFileOrFolders: Dispatch<SetStateAction<FileOrFolder[]>>
}, ref: ForwardedRef<{ addFolder: () => Promise<FileOrFolder>, refresh: () => Promise<void> }>) {

    const {
        onChange,
        value: fileOrFolder,
        editMode,
        setEditMode,
        setSelectedFileOrFolders,
        selectedFileOrFolders
    } = props;

    const [filesOrFolders, setFilesOrFolders] = useState<FileOrFolder[]>([]);

    async function refresh() {
        const children = await db.folderOrFiles.where('parentId').equals(fileOrFolder.id).toArray();
        setFilesOrFolders(children);
    }


    useEffect(() => {
        refresh().then()
    }, [fileOrFolder]);

    useImperativeHandle(ref, () => {
        async function addFolder() {
            const children = await db.folderOrFiles.where('parentId').equals(fileOrFolder.id).toArray();
            const folders = children.filter(c => c.isFile !== true);
            const currentNames = folders.map(f => f.name);
            let newName = `New Folder`;
            let index = 0;
            do {
                if (currentNames.indexOf(newName) >= 0) {
                    index++;
                    newName = `New Folder (${index})`
                }
            } while (currentNames.indexOf(newName) >= 0)
            const newFolder: FileOrFolder = {
                name: newName,
                isFile: false,
                id: nanoid(),
                parentId: fileOrFolder.id
            }
            await db.folderOrFiles.put(newFolder);
            await refresh();
            return newFolder;
        }

        return {
            addFolder,
            refresh
        }
    });
    useEffect(() => {
        function onMouseDownEditMode() {
            setEditMode(false);
        }

        if (editMode) {
            window.addEventListener('mousedown', onMouseDownEditMode)
            window.addEventListener('touchstart', onMouseDownEditMode)
        }
        return () => {
            window.removeEventListener('mousedown', onMouseDownEditMode);
            window.removeEventListener('touchstart', onMouseDownEditMode)
        }
    }, [editMode]);
    return <div
        style={{display: 'flex', flexDirection: "row", alignItems: 'flex-start', flexWrap: 'wrap', paddingTop: 100}}>
        {filesOrFolders.map(fileOrFolder => {
            const isFile = fileOrFolder.isFile === true;
            const isFolder = !isFile;
            const isSelected = selectedFileOrFolders.findIndex(s => s.id === fileOrFolder.id) >= 0;
            return <div key={fileOrFolder.id}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: 5,
                            width: 70,
                            userSelect: 'none'
                        }}
                        onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onTouchStart({
                                eventName: 'mouseup',
                                onChange,
                                fileOrFolder,
                                setEditMode,
                                editMode,
                                setSelectedFileOrFolder: setSelectedFileOrFolders
                            })
                        }}>
                <div style={{display: 'flex', flexDirection: 'column', position: 'relative'}}>
                    {isFolder && <IoFolderOutline style={{fontSize: 50}}/>}
                    {isFile && <IoDocument style={{fontSize: 50}}/>}
                    <div style={{display: editMode ? 'flex' : 'none', bottom: 0, right: -3, position: 'absolute'}}>
                        <div style={{
                            width: 16,
                            height: 16,
                            border: '1px solid rgba(0,0,0,1)',
                            borderRadius: 15,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            backgroundColor: '#FFF'
                        }}>
                            {isSelected &&
                                <IoCheckmarkCircle style={{fontSize: 20, color: "blue", position: 'absolute'}}/>}
                        </div>
                    </div>
                </div>
                <div style={{fontSize: 10, textAlign: 'center'}}>{fileOrFolder.name}</div>
            </div>
        })}

    </div>
});

function arrayBufferToBlob(props: { buffer: ArrayBuffer, type: string }) {
    return new Blob([props.buffer], {type: props.type})
}

function blobToArrayBuffer(blob: Blob): Promise<{ buffer: ArrayBuffer, type: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
            const buffer = reader.result;
            if (buffer !== null && buffer instanceof ArrayBuffer) {
                resolve({buffer, type: blob.type});
            }
        })
        reader.addEventListener('error', reject);
        reader.readAsArrayBuffer(blob);
    })
}