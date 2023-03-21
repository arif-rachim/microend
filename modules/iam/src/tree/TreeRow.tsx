import {Store, useStoreValue} from "@microend/utils";
import {ReactElement, useEffect, useId, useState} from "react";
import {motion} from "framer-motion";
import {AiOutlineDelete} from "react-icons/ai";
import {border, BranchWithLevel, TreeItem} from "./DataTree";
import {Visible} from "@microend/utils";
import {IoFolderOpenOutline, IoFolderOutline} from "react-icons/all";


export function TreeRow(props: {
    row: BranchWithLevel,
    onChange: (value: string) => void,
    onDelete: (row: BranchWithLevel) => void,
    onDrop: (row: BranchWithLevel) => void,
    onToggleFolder: (row: BranchWithLevel) => void,
    $focusedItem: Store<TreeItem | undefined>,
    $itemBeingHovered: Store<BranchWithLevel | undefined>,
    $itemBeingDragged: Store<BranchWithLevel | undefined>,
    $toggleRows: Store<BranchWithLevel[]>,
    rowRenderer: (row: BranchWithLevel) => ReactElement
}) {

    const {
        row,
        onChange,
        $focusedItem,
        $itemBeingHovered,
        $itemBeingDragged,
        onDelete,
        onDrop,
        onToggleFolder,
        $toggleRows,
        rowRenderer
    } = props;
    const [edit, setEdit] = useState<boolean>(false);
    const id = useId();
    const isFocused = useStoreValue($focusedItem, param => {
        return param && row ? param.id === row.id : false
    }, []);
    const isBeingDrag = useStoreValue($itemBeingDragged, param => {
        return param && row ? param.id === row.id : false
    }, [])
    const isDragHover = useStoreValue($itemBeingHovered, param => {
        const rowBeingDrag = $itemBeingDragged.get();
        if (param && rowBeingDrag && param.id === rowBeingDrag.id) {
            return false;
        }
        return param && row ? param.id === row.id : false
    }, []);
    useEffect(() => {
        function onClick() {
            if (edit) {
                const input: HTMLInputElement = document.getElementById(id)! as HTMLInputElement;
                onChange(input.value);
                setEdit(false);
            }
        }

        window.addEventListener('click', onClick);
        return () => {
            window.removeEventListener('click', onClick);
        }
    }, [edit]);
    const hasChildren = row.children && row.children.length > 0;
    const isClosed = $toggleRows.get().findIndex(s => s.id === row.id) >= 0
    return <div style={{
        opacity: isBeingDrag ? 0.2 : 1,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 20 * (row.level - 1),
        backgroundColor: isDragHover ? 'yellow' : isFocused ? '#EEEEEE' : '#FFFFFF',
        borderBottom: border
    }}
                       onDoubleClick={() => {
                           setEdit(true);
                       }}
                       onClick={(event) => {
                           $focusedItem.set(row);
                           if (edit) {
                               event.stopPropagation();
                               event.preventDefault();
                           }
                       }}
                       draggable={true}
                       onDragOver={(event) => {
                           event.preventDefault();
                           $itemBeingHovered.set(row);
                       }}
                       onDragLeave={() => {
                           if ($itemBeingHovered.get() === row) {
                               $itemBeingHovered.set(undefined);
                           }
                       }}
                       onDrop={() => {
                           onDrop($itemBeingDragged.get()!)
                       }}
                       onDragEnd={() => {
                           $itemBeingHovered.set(undefined);
                           $itemBeingDragged.set(undefined);
                       }}
                       onDragStart={() => {
                           $itemBeingDragged.set(row)
                       }}
    >
        <Visible if={edit}>
            <input id={id} type="text" defaultValue={row.name} autoFocus={true}/>
        </Visible>
        <Visible if={!edit}>
            <div style={{display: 'flex', alignItems: 'center'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'content', margin: '0px 5px'}}
                     onClick={() => {
                         onToggleFolder(row);
                     }}>
                    <Visible if={!isClosed}>
                        <IoFolderOpenOutline style={{fontSize: 18}}/>
                    </Visible>
                    <Visible if={isClosed}>
                        <IoFolderOutline style={{fontSize: 18}}/>
                    </Visible>
                </div>
                <div style={{flexGrow: 1}}>{rowRenderer(row)}</div>
                <div style={{
                    cursor: "pointer",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingRight: '10px'
                }} onClick={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDelete(row);
                }}><AiOutlineDelete style={{fontSize: 18}}/></div>
            </div>
        </Visible>
    </div>;
}
