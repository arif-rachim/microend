import {Store, StoreValueRenderer, useStore, useStoreListener, useStoreValue} from "../useStore";
import {TreeItem} from "../Database";
import {Branch} from "../App";
import {useEffect, useId, useState} from "react";
import {motion} from "framer-motion";
import {AiOutlineDelete} from "react-icons/ai";


type BranchWithLevel = Branch & { level: number };
const border = '1px solid rgba(0,0,0,0.1)';

export const rootRole: TreeItem = {
    name: 'root',
    id: '.',
    parentId: '',
    order: 0
}

export function DataTree(props: {
    $treeData: Store<TreeItem[]>,
    $focusedItem: Store<TreeItem | undefined>,
    onItemChange: (id: string, value: Partial<TreeItem>) => void,
    onItemDelete: (role: Branch) => void,
    onItemMove: (source: Branch, target: Branch) => void
}) {
    const {$focusedItem, $treeData} = props;
    const $rolesAndLevel = useStore<BranchWithLevel[]>([]);
    const $rowBeingDragHover = useStore<BranchWithLevel | undefined>(undefined);
    const $rowBeingDrag = useStore<BranchWithLevel | undefined>(undefined);
    const $rolesTree = useStore<Branch>({
        parentId: '',
        parent: undefined,
        name: rootRole.name,
        id: rootRole.id,
        children: [],
        order: 1
    });
    useStoreListener($treeData, r => r, (roles) => {
        const roleTree: Branch = constructBranch(roles);
        const orderedRole = flatTree([roleTree], [], 0);
        $rolesTree.set(roleTree);
        $rolesAndLevel.set(orderedRole);
    })
    return <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{display: 'flex', backgroundColor: '#F2F2F2', borderBottom: border, borderTop: border}}>
            <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1, borderRight: border}}>
                <div style={{padding: '5px 10px'}}>
                    Role Name
                </div>
                <input style={{border: 'none', borderTop: border, padding: '5px 10px'}}/>
            </div>
            <div style={{padding: '5px 10px'}}>
                Assigned Users
            </div>
        </div>
        <StoreValueRenderer store={$rolesAndLevel} selector={s => s} render={(roles: BranchWithLevel[]) => {
            return <div style={{height: '100%', backgroundColor: '#FEFEFE'}}>
                {roles.filter(r => r.id !== rootRole.id).map((role, index) => {
                    return <RenderTreeNode branch={role}
                                           key={role.id}
                                           onChange={(value) => {
                                               props.onItemChange(role.id, {name: value});
                                           }}
                                           onDelete={(role: BranchWithLevel) => {
                                               $focusedItem.set(undefined);
                                               props.onItemDelete(role);
                                           }}
                                           onDrop={(draggedRole: BranchWithLevel) => {
                                               props.onItemMove(draggedRole, role);
                                           }}
                                           $focusedItem={$focusedItem}
                                           $itemBeingHovered={$rowBeingDragHover}
                                           $itemBeingDragged={$rowBeingDrag}

                    />
                })}
            </div>
        }}/>
    </div>;
}

const constructBranch = (roles: TreeItem[]): Branch => {

    const tree: Branch = {
        parentId: '',
        parent: undefined,
        name: rootRole.name,
        id: rootRole.id,
        order: rootRole.order,
        children: []
    }
    return roles.reduce((root: Branch, role) => {
        const stacks: TreeItem[] = [];
        let currentRole: TreeItem | undefined = role;
        do {
            if (currentRole) {
                stacks.unshift(currentRole);
                let parentRole = roles.find(r => r.id === currentRole!.parentId);
                if (parentRole === undefined && currentRole.parentId === rootRole.id) {
                    parentRole = rootRole
                }
                currentRole = parentRole;
            }
        } while (currentRole)

        let leaf: Branch = root;
        for (let i = 1; i < stacks.length; i++) {
            const role: TreeItem = stacks[i];
            const child = leaf.children.find(l => l.id === role.id);
            if (child) {
                leaf = child;
            } else {
                let child: Branch = {
                    parentId: leaf.id,
                    parent: leaf,
                    children: [],
                    name: role.name,
                    id: role.id,
                    order: role.order
                }
                leaf.children.push(child);
                leaf = child;
            }
        }
        return root;
    }, tree)
}


function flatTree(tree: Branch[], result: BranchWithLevel[], level: number) {
    tree.sort((a, b) => a.order - b.order).forEach((leaf: Branch) => {
        result.push({
            name: leaf.name,
            id: leaf.id,
            parentId: getVal(leaf, 'parent.id', ''),
            order: leaf.order,
            level,
            children: leaf.children,
            parent: leaf.parent
        });
        const trees = flatTree(leaf.children, [], level + 1);
        result = result.concat(trees);
    });
    return result;
}

function RenderTreeNode(props: {
    branch: BranchWithLevel,
    onChange: (value: string) => void,
    onDelete: (role: BranchWithLevel) => void,
    onDrop: (role: BranchWithLevel) => void,
    $focusedItem: Store<TreeItem | undefined>,
    $itemBeingHovered: Store<BranchWithLevel | undefined>,
    $itemBeingDragged: Store<BranchWithLevel | undefined>
}) {

    const {branch, onChange, $focusedItem, $itemBeingHovered, $itemBeingDragged, onDelete, onDrop} = props;
    const [edit, setEdit] = useState<boolean>(true);
    const id = useId();
    const isFocused = useStoreValue($focusedItem, param => {
        return param && branch ? param.id === branch.id : false
    }, []);
    const isBeingDrag = useStoreValue($itemBeingDragged, param => {
        return param && branch ? param.id === branch.id : false
    }, [])
    const isDragHover = useStoreValue($itemBeingHovered, param => {
        const rowBeingDrag = $itemBeingDragged.get();
        if (param && rowBeingDrag && param.id === rowBeingDrag.id) {
            return false;
        }
        return param && branch ? param.id === branch.id : false
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

    return <motion.div style={{
        opacity: isBeingDrag ? 0.2 : 1,
        minHeight: 22,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 10 * branch.level,
        backgroundColor: isDragHover ? 'yellow' : isFocused ? '#EEEEEE' : '#FFFFFF',
        borderBottom: border
    }}
                       onDoubleClick={() => {
                           setEdit(true);
                       }}
                       onClick={(event) => {
                           $focusedItem.set(branch);
                           if (edit) {
                               event.stopPropagation();
                               event.preventDefault();
                           }
                       }}
                       draggable={true}
                       onDragOver={(event) => {
                           event.preventDefault();
                           $itemBeingHovered.set(branch);
                       }}
                       onDragLeave={() => {
                           if ($itemBeingHovered.get() === branch) {
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
                           $itemBeingDragged.set(branch)
                       }}
    >
        {edit && <input id={id} type="text" defaultValue={branch.name} autoFocus={true}
                        style={{border: "none", padding: '3px 5px'}}/>}
        {!edit && <div style={{display: 'flex'}}>{branch.name}
            <div style={{flexGrow: 1}}/>
            <div style={{
                cursor: "pointer",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingRight: '10px'
            }} onClick={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(branch);
            }}><AiOutlineDelete style={{fontSize: 18}}/></div>
        </div>}
    </motion.div>;
}


const getVal = (val: any, key: string, defaultVal: any): any => {
    const keys = key.split('.');
    for (const k of keys) {
        if (typeof val === 'object' && k in val) {
            val = val[k];
        } else {
            return defaultVal;
        }
    }
    return val;
}
