import {getMicroEnd} from "@microend/lib";
import {StoreValueRenderer, useStore} from "./useStore";
import {AnimatePresence, motion} from "framer-motion";
import {ReactElement, useEffect, useRef, useState} from "react";
import {nanoid} from "nanoid";
import {db} from "./Database";
import {Branch, DataTree, DataTreeRef, rootRole, TreeItem} from "./tree/DataTree";
import {Visible} from "./utils/Visible";

const me = getMicroEnd();

const border = '1px solid rgba(0,0,0,0.1)';

function Toggle(props: { value: string, dataProvider: string[], onChange: (param: string) => void }) {
    const {dataProvider, value, onChange} = props;
    return <div style={{display: 'flex', flexDirection: 'row'}}>
        {dataProvider.map(s => {
            return <motion.div key={s} style={{border, padding: '3px 10px', cursor: 'pointer'}}
                               animate={{backgroundColor: value === s ? '#CCC' : '#FFF'}}
                               onClick={() => onChange(s)}>{s}</motion.div>
        })}
    </div>;
}

function App() {

    const [selectedTab,setSelectedTab] = useState<'Roles'|'Users'>('Roles')
    const $showPanel = useStore<ReactElement | undefined>(undefined);
    const dataTreeRef = useRef<DataTreeRef>(null);
    const $roles = useStore<TreeItem[]>([]);

    async function refreshTable() {
        const roles = await db.roles.toArray();
        $roles.set(roles);
    }

    useEffect(() => {
        refreshTable().then()
    }, [])
    return (<div
        style={{display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative'}}>
        <div style={{display: 'flex', padding: 5}}>
            <Toggle value={selectedTab} dataProvider={['Roles','Users']} onChange={value => {
                setSelectedTab(value as any);
            }} />
            <div style={{flexGrow: 1}}></div>
            <motion.div style={{border, padding: '3px 10px', cursor: 'pointer'}} whileTap={{scale: 0.95}}
                        onClick={async () => {
                            // here we are adding roles to data !
                            const focusedRole = dataTreeRef.current?.$focusedItem.get();
                            const parentId = focusedRole ? focusedRole.id : rootRole.id;
                            await addRole({
                                parentId: parentId,
                                id: nanoid(),
                                name: '',
                                order: 1
                            });
                            await refreshTable();
                        }}>
                <Visible if={selectedTab === 'Roles'}>
                    <div>Add Roles</div>
                </Visible>
                <Visible if={selectedTab === 'Users'}>
                    <div>Add Users</div>
                </Visible>

            </motion.div>
        </div>
        <DataTree $treeData={$roles}
                  ref={dataTreeRef}
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
