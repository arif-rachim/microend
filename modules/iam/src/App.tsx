import {getMicroEnd} from "@microend/lib";
import {StoreValueRenderer, useStore} from "./useStore";
import {AnimatePresence, motion} from "framer-motion";
import {ReactElement, useEffect} from "react";
import {nanoid} from "nanoid";
import {db, TreeItem} from "./Database";
import {DataTree, rootRole} from "./tree/DataTree";

const me = getMicroEnd();

const border = '1px solid rgba(0,0,0,0.1)';

export interface Branch extends TreeItem {
    parent: Branch | undefined,
    children: Branch[]
}

const getPath = (branch: Branch): string => {
    if (branch.parent) {
        return getPath(branch.parent) + '/' + branch.id;
    }
    return branch.id;
}


function App() {

    const $selectedTab = useStore<'roles' | 'users'>('roles');
    const $showPanel = useStore<ReactElement | undefined>(undefined);
    const $focusedRole = useStore<TreeItem | undefined>(undefined);
    const $roles = useStore<TreeItem[]>([]);

    async function refreshTable() {
        const roles = await db.roles.toArray();
        $roles.set(roles);
    }

    async function onRenameItem(role: TreeItem, value: string) {
        await renameRole(role.id, value);
        await refreshTable();
    }


    useEffect(() => {
        refreshTable().then()
    }, [])

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
                                await refreshTable();
                            }}>
                    Add Roles
                </motion.div>
            </div>
        }}/>
        <DataTree $treeData={$roles} $focusedItem={$focusedRole}
                  onItemChange={async (id, value) => {
                      await renameRole(id, value.name ?? '');
                      await refreshTable();
                  }}
                  onItemDelete={async role => {
                      await deleteRoles([role]);
                      await refreshTable();
                  }}
                  onItemMove={async (source, target) => {
                      await moveRoleTo(source, target);
                      await refreshTable();
                  }}
        />
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


async function addRole(role: TreeItem, insertBefore?: string) {
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

async function moveRoleTo(roleToMove: Branch, parent: Branch) {

    let targetParent: any = parent;
    do {
        if (targetParent && targetParent.id === roleToMove.id) {
            return;
        }
    } while (targetParent = targetParent.parent)


    await db.roles.update(roleToMove.id, {
        parentId: parent.id
    });
}

export default App
