import {useEffect, useState} from "react";
import {db} from "../../Database";

export function RoleRenderer(props: { roles: string }) {
    const roles = props.roles;
    const [role, setRole] = useState<{ name: string, id: string }[]>([]);
    useEffect(() => {
        (async () => {
            const roleEntity = await db.roles.where('id').anyOfIgnoreCase(roles.split(',')).toArray();
            setRole(roleEntity);
        })();
    }, [roles])
    return <div style={{display: 'flex'}}>
        {role.map(rol => {
            return <div key={rol.id} style={{
                padding: '0px 5px',
                border: '1px solid rgba(0,0,0,0.1)',
                fontSize: 13,
                marginRight: 3
            }}>{rol.name}</div>
        })}
    </div>;
}