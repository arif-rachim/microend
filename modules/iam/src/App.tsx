import {getMicroEnd} from "@microend/lib";
import {motion} from "framer-motion";
import {useEffect, useRef, useState} from "react";
import {nanoid} from "nanoid";
import {AccessList, db, User} from "./Database";
import {Branch, DataTree, DataTreeRef, rootRole, TreeItem} from "./tree/DataTree";
import {DataGrid} from "./grid/DataGrid";
import {useSlidePanel} from "./slide/SlidePanel";

import {AiOutlineUser, AiOutlineUsergroupAdd} from "react-icons/ai";
import {UserPanel} from "./panel/UserPanel";
import {Toggle} from "./toggle/Toggle";
import {TreeRowItem} from "./tree/component/TreeRowItem";
import {RoleRenderer} from "./grid/component/RoleRenderer";
import {useStore, Visible} from "@microend/utils";

const me = getMicroEnd();

const border = '1px solid rgba(0,0,0,0.1)';

export type AccessParam = Pick<AccessList, 'name' | 'id' | 'description'>;

const service = me.createService({
    registerAccessList: async (params: { moduleId: string, accessList: AccessParam[] }) => {
        const {accessList, moduleId} = params;
        for (const access of accessList) {
            const list: AccessList = {
                name: access.name,
                description: access.description,
                id: access.id,
                moduleName: moduleId
            }
            const count = await db.accessList.where('id').equals(access.id).count();
            if (count === 0) {
                await db.accessList.put(list);
            }
        }
        return true
    },
});

export type IamService = typeof service;


function App() {
    const [selectedTab, setSelectedTab] = useState<'Roles' | 'Users'>('Roles')
    const dataTreeRef = useRef<DataTreeRef>(null);
    const $roles = useStore<TreeItem[]>([]);
    const $users = useStore<User[]>([])

    async function refreshRoles() {
        const roles = await db.roles.toArray();
        $roles.set(roles);
    }

    async function refreshUsers() {
        const users = await db.users.toArray();
        $users.set(users);
    }

    useEffect(() => {
        if (selectedTab === 'Roles') {
            refreshRoles().then()
        }
        if (selectedTab === 'Users') {
            refreshUsers().then()
        }

    }, [selectedTab]);

    async function addNewRole() {
        const focusedRole = dataTreeRef.current?.$focusedItem.get();
        const parentId = focusedRole ? focusedRole.id : rootRole.id;
        await addRole({
            parentId: parentId,
            id: nanoid(),
            name: '',
            order: 1
        });
        await refreshRoles();
    }

    const [showPanel, SlidePanel] = useSlidePanel();

    async function addNewUser() {
        await showPanel<User | false>(closePanel => {
            return <UserPanel closePanel={closePanel}/>
        });
        await refreshUsers();
    }


    return (<div
        style={{display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative'}}>
        <div style={{display: 'flex', padding: 5}}>
            <Toggle value={selectedTab} dataProvider={['Roles', 'Users']} onChange={value => {
                setSelectedTab(value as any);
            }}/>
            <div style={{flexGrow: 1}}></div>
            <motion.div style={{border, padding: '3px 10px', cursor: 'pointer', display: 'flex'}}
                        whileTap={{scale: 0.95}}
                        onClick={async () => {
                            if (selectedTab === 'Roles') {
                                await addNewRole();
                            }
                            if (selectedTab === 'Users') {
                                await addNewUser();
                            }
                        }}>
                <Visible if={selectedTab === 'Roles'}>
                    <div style={{display: 'flex', marginRight: 5}}><AiOutlineUsergroupAdd style={{fontSize: 18}}/></div>
                    <div>Add Roles</div>
                </Visible>
                <Visible if={selectedTab === 'Users'}>
                    <div style={{display: 'flex', marginRight: 5}}><AiOutlineUser style={{fontSize: 18}}/></div>
                    <div>Add Users</div>
                </Visible>
            </motion.div>
        </div>
        <Visible if={selectedTab === 'Roles'}>
            <DataTree $treeData={$roles}
                      ref={dataTreeRef}
                      onItemChange={async (id, value) => {
                          await renameRole(id, value.name ?? '');
                          await refreshRoles();
                      }}
                      onItemDelete={async role => {
                          await deleteRoles([role]);
                          await refreshRoles();
                      }}
                      onItemMove={async (source, target) => {
                          await moveRoleTo(source, target);
                          await refreshRoles();
                      }}
                      rowRenderer={(role) => {
                          return <TreeRowItem role={role} showPanel={showPanel}/>
                      }}
            />
        </Visible>
        <Visible if={selectedTab === 'Users'}>
            <DataGrid $gridData={$users} columns={{
                name: {
                    title: 'Name',
                    headerStyle: {},
                    cellStyle: {},
                    width: '30%',
                    renderer: ({value}) => <label>{value}</label>
                },
                email: {
                    title: 'E-Mail',
                    headerStyle: {},
                    cellStyle: {},
                    width: '15%',
                    renderer: ({value}) => <label>{value}</label>
                },
                phoneNumber: {
                    title: 'Phone Number',
                    headerStyle: {},
                    cellStyle: {},
                    width: '15%',
                    renderer: ({value}) => <label>{value}</label>
                },
                roles: {
                    title: 'Role(s)',
                    headerStyle: {},
                    cellStyle: {},
                    width: '40%',
                    renderer: ({value}) => <RoleRenderer roles={value}/>
                }
            }} columnKey={'id'}/>
        </Visible>
        {SlidePanel}
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
