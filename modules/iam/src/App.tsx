import {getMicroEnd} from "@microend/lib";
import {Store, StoreValueRenderer, useStore, useStoreValue} from "./useStore";
import {AnimatePresence, motion} from "framer-motion";
import {ReactElement, useEffect, useId, useState} from "react";
import {nanoid} from "nanoid";
import {db, Role} from "./Database";
import {AiOutlineDelete} from "react-icons/ai";

const me = getMicroEnd();
const border = '1px solid rgba(0,0,0,0.1)';

const rootRole: Role = {
    name: 'root',
    id: '.',
    parentId: '',
    order: 0
}

export interface Tree {
    parent: Tree | undefined,
    name: string
    id: string,
    children: Tree[],
    order: number
}

const getPath = (tree: Tree): string => {
    if (tree.parent) {
        return getPath(tree.parent) + '/' + tree.id;
    }
    return tree.id;
}

const constructTree = (roles: Role[]) => {

    const tree: Tree = {
        parent: undefined,
        name: rootRole.name,
        id: rootRole.id,
        order: rootRole.order,
        children: []
    }
    return roles.reduce((root: Tree, role) => {
        const stacks: Role[] = [];
        let currentRole: Role | undefined = role;
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

        let leaf: Tree = root;
        for (let i = 1; i < stacks.length; i++) {
            const role: Role = stacks[i];
            const child = leaf.children.find(l => l.id === role.id);
            if (child) {
                leaf = child;
            } else {
                let child: Tree = {
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
type RoleLevel = Role & { level: number, children: Tree[], parent: Tree | undefined }

function flatTree(tree: Tree[], result: RoleLevel[], level: number) {
    tree.sort((a, b) => a.order - b.order).forEach((leaf: Tree) => {
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
    role: RoleLevel,
    onChange: (value: string) => void,
    onDelete: (role: RoleLevel) => void,
    onDrop: (role: RoleLevel) => void,
    $focusedRole: Store<Role | undefined>,
    $rowBeingDragHover: Store<RoleLevel | undefined>,
    $rowBeingDrag: Store<RoleLevel | undefined>
}) {

    const {role, onChange, $focusedRole, $rowBeingDragHover, $rowBeingDrag, onDelete, onDrop} = props;
    const [edit, setEdit] = useState<boolean>(true);
    const id = useId();
    const isFocused = useStoreValue($focusedRole, param => {
        return param && role ? param.id === role.id : false
    }, []);
    const isBeingDrag = useStoreValue($rowBeingDrag, param => {
        return param && role ? param.id === role.id : false
    }, [])
    const isDragHover = useStoreValue($rowBeingDragHover, param => {
        const rowBeingDrag = $rowBeingDrag.get();
        if (param && rowBeingDrag && param.id === rowBeingDrag.id) {
            return false;
        }
        return param && role ? param.id === role.id : false
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
        paddingLeft: 10 * role.level,
        backgroundColor: isDragHover ? 'yellow' : isFocused ? '#EEEEEE' : '#FFFFFF',
        borderBottom: border
    }}
                       onDoubleClick={() => {
                           setEdit(true);
                       }}
                       onClick={(event) => {
                           $focusedRole.set(role);
                           if (edit) {
                               event.stopPropagation();
                               event.preventDefault();
                           }
                       }}
                       draggable={true}
                       onDragOver={(event) => {
                           event.preventDefault();
                           $rowBeingDragHover.set(role);
                       }}
                       onDragLeave={() => {
                           if ($rowBeingDragHover.get() === role) {
                               $rowBeingDragHover.set(undefined);
                           }
                       }}
                       onDrop={() => {
                           onDrop($rowBeingDrag.get()!)
                       }}
                       onDragEnd={() => {
                           $rowBeingDragHover.set(undefined);
                           $rowBeingDrag.set(undefined);
                       }}
                       onDragStart={() => {
                           $rowBeingDrag.set(role)
                       }}
    >
        {edit && <input id={id} type="text" defaultValue={role.name} autoFocus={true}
                        style={{border: "none", padding: '3px 5px'}}/>}
        {!edit && <div style={{display: 'flex'}}>{role.name}
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
                onDelete(role);
            }}><AiOutlineDelete style={{fontSize: 18}}/></div>
        </div>}
    </motion.div>;
}

async function refreshTable($rolesTree: Store<Tree>, $roles: Store<RoleLevel[]>) {
    const roles = await db.roles.toArray();
    const roleTree: Tree = constructTree(roles);
    const orderedRole = flatTree([roleTree], [], 0);
    $rolesTree.set(roleTree);
    $roles.set(orderedRole);
}

function App() {

    const $selectedTab = useStore<'roles' | 'users'>('roles');
    const $showPanel = useStore<ReactElement | undefined>(undefined);
    const $roles = useStore<RoleLevel[]>([]);
    const $rowBeingDragHover = useStore<RoleLevel | undefined>(undefined);
    const $rowBeingDrag = useStore<RoleLevel | undefined>(undefined);
    const $rolesTree = useStore<Tree>({
        parent: undefined,
        name: rootRole.name,
        id: rootRole.id,
        children: [],
        order: 1
    });

    const $focusedRole = useStore<Role | undefined>(undefined);
    useEffect(() => {
        refreshTable($rolesTree, $roles).then()
    }, []);

    return (<div
        style={{display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative'}}>
        <StoreValueRenderer store={$selectedTab} selector={s => s} render={(value) => {
            return <div style={{display: 'flex', padding: 5}}>
                <motion.div style={{border, padding: '3px 10px', cursor: 'pointer'}}
                            animate={{backgroundColor: value === 'roles' ? '#CCC' : '#FFF'}}
                            onClick={() => $selectedTab.set('roles')}>Roles
                </motion.div>
                <motion.div style={{border, padding: '3px 10px', cursor: 'pointer'}}
                            animate={{backgroundColor: value === 'users' ? '#CCC' : '#FFF'}}
                            onClick={() => $selectedTab.set('users')}>Users
                </motion.div>
                <div style={{flexGrow: 1}}></div>
                <motion.div style={{border, padding: '3px 10px', cursor: 'pointer'}} whileTap={{scale: 0.95}}
                            onClick={async () => {
                                // here we are adding roles to data !
                                const focusedRole = $focusedRole.get();
                                const parentId = focusedRole ? focusedRole.id : rootRole.id;
                                await addRole({
                                    parentId: parentId,
                                    id: nanoid(),
                                    name: '',
                                    order: 1
                                });
                                await refreshTable($rolesTree, $roles);
                            }}>
                    Add Roles
                </motion.div>
            </div>
        }}/>
        <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
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
            <StoreValueRenderer store={$roles} selector={s => s} render={(roles: RoleLevel[]) => {
                return <div style={{height: '100%', backgroundColor: '#FEFEFE'}}>
                    {roles.filter(r => r.id !== rootRole.id).map((role, index) => {
                        return <RenderTreeNode role={role}
                                               key={role.id}
                                               onChange={async (value) => {
                                                   await renameRole(role.id, value);
                                                   await refreshTable($rolesTree, $roles);
                                               }}
                                               onDelete={async (role: RoleLevel) => {
                                                   $focusedRole.set(undefined);
                                                   await deleteRoles([role]);
                                                   await refreshTable($rolesTree, $roles);
                                               }}
                                               onDrop={async (draggedRole: RoleLevel) => {
                                                   await moveRoleTo(draggedRole, role);
                                                   await refreshTable($rolesTree, $roles);
                                               }}
                                               $focusedRole={$focusedRole}
                                               $rowBeingDragHover={$rowBeingDragHover}
                                               $rowBeingDrag={$rowBeingDrag}

                        />
                    })}
                </div>
            }}/>
        </div>
        <StoreValueRenderer store={$showPanel} selector={s => s} render={(s) => {
            const showPanel = s !== undefined;
            return <motion.div style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'absolute',
                width: '100%',
                height: '100%',
                alignItems: 'center'
            }}
                               initial={{y: '-100%'}}
                               animate={{y: showPanel ? '0' : '-100%'}}
                               exit={{y: '-100%'}}
                               transition={{bounce: 0}}
            >
                <AnimatePresence>
                    {showPanel &&
                        <motion.div style={{
                            backgroundColor: '#F2F2F2',
                            boxShadow: '0 5px 5px -3px rgba(0,0,0,0.3)',
                            borderBottomRightRadius: 10,
                            borderBottomLeftRadius: 10
                        }}
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    exit={{opacity: 0}}>
                            {$showPanel.get()}
                        </motion.div>
                    }
                </AnimatePresence>
            </motion.div>
        }}/>
    </div>)
}


async function addRole(role: Role, insertBefore?: string) {
    const children = await db.roles.where({parentId: role.parentId}).toArray();
    role.order = children.length;
    await db.roles.put(role, role.id);
    const sortedChildren = children.sort((a, b) => a.order - b.order);
    if (insertBefore) {
        const index = sortedChildren.findIndex(c => c.id === insertBefore);
        sortedChildren.splice(index, 0, role);
    }
    for (let i = 0; i < sortedChildren.length; i++) {
        const role = sortedChildren[i];
        role.order = i;
        await db.roles.update(role.id, {order: i});
    }
}

async function renameRole(id: string, name: string) {
    await db.roles.update(id, {name})
}

async function deleteRoles(role: { id: string, children: any[] }[]) {
    for (const roleElement of role) {
        await deleteRoles(roleElement.children);
        await db.roles.delete(roleElement.id);
    }
}

async function moveRoleTo(roleToMove: { id: string, parentId: string, children: { id: string }[] }, parent: { id: string, parent: any }) {

    let targetParent: any = parent;
    do{
        if(targetParent && targetParent.id === roleToMove.id){
            return;
        }
    }while(targetParent = targetParent.parent)


    await db.roles.update(roleToMove.id, {
        parentId: parent.id
    });
}

export default App
