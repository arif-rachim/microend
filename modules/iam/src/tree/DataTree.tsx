import {Store, StoreValueRenderer, useStore, useStoreListener} from "../useStore";
import {TreeRow} from "./TreeRow";
import {ForwardedRef, forwardRef, useImperativeHandle} from "react";

export type BranchWithLevel = Branch & { level: number };
export const border = '1px solid rgba(0,0,0,0.1)';

export interface TreeItem {
    parentId: string,
    id: string,
    name: string,
    order: number
}


export const rootRole: TreeItem = {
    name: 'root',
    id: '.',
    parentId: '',
    order: 0
}

export type DataTreeRef = {
    $focusedItem: Store<TreeItem | undefined>
}

export const DataTree = forwardRef(function DataTree(props: {
    $treeData: Store<TreeItem[]>,
    onItemChange: (id: string, value: Partial<TreeItem>) => void,
    onItemDelete: (row: Branch) => void,
    onItemMove: (source: Branch, target: Branch) => void
}, ref: ForwardedRef<DataTreeRef>) {
    const $focusedItem = useStore<TreeItem | undefined>(undefined);
    const {$treeData} = props;
    const $rows = useStore<BranchWithLevel[]>([]);
    const $rowBeingDragHover = useStore<BranchWithLevel | undefined>(undefined);
    const $rowBeingDrag = useStore<BranchWithLevel | undefined>(undefined);
    const $toggleRows = useStore<BranchWithLevel[]>([]);
    const $trunk = useStore<Branch | undefined>(undefined);
    useStoreListener($treeData, r => r, (roles) => {
        const trunk: Branch = constructTrunk(roles);
        const orderedRole = flatTree($toggleRows.get(), [trunk], 0);
        $trunk.set(trunk);
        $rows.set(orderedRole);
    });

    useImperativeHandle(ref, () => {
        return {
            $focusedItem
        }
    })
    useStoreListener($toggleRows, r => r, (toggleRows) => {
        const trunk = $trunk.get()!;
        const orderedRole = flatTree(toggleRows, [trunk], 0);
        $rows.set(orderedRole);
    })
    return <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{
            display: 'flex',
            backgroundColor: '#F2F2F2',
            borderBottom: border,
            borderTop: border,
            padding: '3px 5px'
        }}>
            <div style={{flexGrow: 1}}>
                Role Name
            </div>
            <div>
                Assigned Users
            </div>
            <div style={{width: 30}}>

            </div>
        </div>
        <StoreValueRenderer store={$rows} selector={s => s} render={(rows: BranchWithLevel[]) => {
            return <div style={{height: '100%', backgroundColor: '#FEFEFE'}}>
                {rows.filter(r => r.id !== rootRole.id).map((row) => {
                    return <TreeRow row={row}

                                    $toggleRows={$toggleRows}
                                    key={row.id}
                                    onChange={(value) => {
                                        props.onItemChange(row.id, {name: value});
                                    }}
                                    onDelete={(row: BranchWithLevel) => {
                                        $focusedItem.set(undefined);
                                        props.onItemDelete(row);
                                    }}
                                    onDrop={(draggedRole: BranchWithLevel) => {
                                        props.onItemMove(draggedRole, row);
                                    }}
                                    onToggleFolder={(row: BranchWithLevel) => {
                                        $toggleRows.set(rows => {
                                            const toggleRows = [...rows];
                                            const index = toggleRows.findIndex(r => r.id === row.id);
                                            if (index >= 0) {
                                                toggleRows.splice(index, 1);
                                            } else {
                                                toggleRows.push(row);
                                            }
                                            return toggleRows;
                                        });
                                    }}
                                    $focusedItem={$focusedItem}
                                    $itemBeingHovered={$rowBeingDragHover}
                                    $itemBeingDragged={$rowBeingDrag}

                    />
                })}
            </div>
        }}/>
    </div>;
});

const constructTrunk = (roles: TreeItem[]): Branch => {

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
            const child = leaf.children.find((l: Branch) => l.id === role.id);
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


function flatTree(toggleRows: Branch[], tree: Branch[], level: number) {
    let result: BranchWithLevel[] = [];
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
        const isClosed = toggleRows.findIndex(r => r.id === leaf.id) >= 0;
        if (!isClosed) {
            const trees = flatTree(toggleRows, leaf.children, level + 1);
            result = result.concat(trees);
        }
    });
    return result;
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


export interface Branch extends TreeItem {
    parent: Branch | undefined,
    children: Branch[]
}

export const getPath = (branch: Branch): string => {
    if (branch.parent) {
        return getPath(branch.parent) + '/' + branch.id;
    }
    return branch.id;
}
