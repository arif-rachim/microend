import {Branch} from "../DataTree";
import {FactoryFunction, FactoryFunctionConfig} from "@microend/utils";
import {useEffect, useState} from "react";
import {db, User} from "../../Database";
import {AssignUserRolePanel} from "../../panel/AssignUserRolePanel";
import {AiOutlineKey, AiOutlineUser} from "react-icons/ai";

export function TreeRowItem<T>(props: { role: Branch & { level: number }, showPanel: <T>(factory: FactoryFunction<T>, config?: (FactoryFunctionConfig | undefined)) => Promise<T> }) {
    const {showPanel, role} = props;
    const [currentSelectedUsers, setCurrentSelectedUsers] = useState<User[]>([]);
    const roleId = role.id;
    useEffect(() => {
        (async () => {
            const currentSelectedUsers = await db.users.filter(u => u.roles.indexOf(role.id) >= 0).toArray();
            setCurrentSelectedUsers(currentSelectedUsers);
        })();
    }, [roleId])

    return <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
        <div style={{flexGrow: 1}}>{role.name}</div>
        <div style={{fontSize: 10}}>{currentSelectedUsers.length}</div>
        <div style={{display: 'flex', marginRight: 5, cursor: 'pointer'}} onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const selectedUsers: User[] | false = await showPanel((closePanel) => {
                return <AssignUserRolePanel closePanel={closePanel}
                                            currentSelectedUsers={currentSelectedUsers}/>
            })
            if (selectedUsers === false) {
                return;
            }
            const alreadyAddedId: string[] = [];

            for (const selectedUser of currentSelectedUsers) {
                const selectedIndex = selectedUsers.findIndex(s => s.id === selectedUser.id);
                if (selectedIndex < 0) {
                    const roles: string[] = selectedUser.roles.split(',').map(s => s.trim()).filter(s => s !== role.id);
                    db.users.update(selectedUser, {roles: roles.join(',')});
                } else {
                    alreadyAddedId.push(selectedUser.id);
                }
            }

            for (const selectedUser of selectedUsers) {
                if (alreadyAddedId.indexOf(selectedUser.id) >= 0) {
                    continue;
                }
                const roles: string[] = selectedUser.roles.split(',').map(s => s.trim());
                db.users.update(selectedUser, {roles: [...roles, role.id].filter(s => s).join(',')});
            }
            setCurrentSelectedUsers(selectedUsers);
        }}><AiOutlineUser style={{fontSize: 18}}/></div>
        <div style={{display: 'flex', marginRight: 5, cursor: 'pointer'}} onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
        }}><AiOutlineKey style={{fontSize: 18}}/></div>
    </div>;
}