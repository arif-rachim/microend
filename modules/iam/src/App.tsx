import {getMicroEnd} from "@microend/lib";
import {Store, StoreValueRenderer, useStore, useStoreValue} from "./useStore";
import {AnimatePresence, motion} from "framer-motion";
import {ReactElement, useEffect, useId, useRef, useState} from "react";
import {nanoid} from "nanoid";
import {db, Role} from "./Database";

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

const getLeaf = (tree: Tree, path: string) => {
    const segments = path.split('/');
    let leaf: Tree = tree;
    for (const segment of segments) {
        if (segment === '.') {
            continue;
        }
        leaf = leaf.children.find(t => t.id === segment)!;
    }
    return leaf;
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
type RoleLevel = Role & { level: number }

function flatTree(tree: Tree[], result: RoleLevel[], level: number) {
    tree.sort((a, b) => a.order - b.order).forEach((leaf: Tree) => {
        result.push({name: leaf.name, id: leaf.id, parentId: getVal(leaf, 'parent.id', ''), order: leaf.order, level});
        const trees = flatTree(leaf.children, [], level + 1);
        result = result.concat(trees);
    });
    return result;
}

function RenderTreeNode(props: { role: RoleLevel, onChange: (value: string) => void, $focusedRole: Store<Role | undefined> }) {
    const {role, onChange, $focusedRole} = props;
    const [edit, setEdit] = useState<boolean>(false);
    const id = useId();
    const isFocused = useStoreValue($focusedRole, param => {
        return param && role ? param.id === role.id : false
    }, [])
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
        borderBottom: border,
        minHeight: 22,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 10 * role.level
    }}
                       initial={{backgroundColor: isFocused ? '#EEEEEE' : '#FFFFFF'}}
                       animate={{backgroundColor: isFocused ? '#EEEEEE' : '#FFFFFF'}}
                       onDoubleClick={() => {
                           setEdit(true);
                       }} onClick={(event) => {
        $focusedRole.set(role);
        if (edit) {
            event.stopPropagation();
            event.preventDefault();
        }
    }}>
        {edit && <input id={id} type="text" defaultValue={role.name} autoFocus={true}
                        style={{border: "none", padding: '3px 5px'}}/>}
        {!edit && <div>{role.name} : {role.order}</div>}
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
    const movingRow = useRef<RoleLevel[]>([]);
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
                                               $focusedRole={$focusedRole}/>
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

export default App
