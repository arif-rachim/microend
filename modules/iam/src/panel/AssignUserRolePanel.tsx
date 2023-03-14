import {db, User} from "../Database";
import {Store, StoreValueRenderer, useStore, useStoreValue} from "../useStore";
import {useEffect, useState} from "react";
import {DataGrid} from "../grid/DataGrid";
import produce from "immer";

export function AssignUserRolePanel(props: { closePanel: (selectedUsers: User[] | false) => void, currentSelectedUsers: User[] }) {

    const {closePanel, currentSelectedUsers} = props;
    const $users = useStore<User[]>([]);
    const $gridData = useStore($users.get());
    const $selectedUser = useStore<User[]>([...currentSelectedUsers]);

    async function refreshTable() {
        const users = await db.users.toArray();
        $users.set(users);
        $gridData.set(users);
    }

    useEffect(() => {
        refreshTable().then();
    }, [])
    return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{
            backgroundColor: 'white',
            padding: 10,
            width: '100%',
            maxWidth: 800,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <input type="search" style={{marginTop: 10, marginBottom: 10}} placeholder={'Search here'}
                   onChange={(event) => {
                       const query: string = event.target.value.toLowerCase();
                       $gridData.set($users.get().filter((item) => {
                           return (item.name.toLowerCase().indexOf(query) >= 0 ||
                               item.email.toLowerCase().indexOf(query) >= 0 ||
                               item.phoneNumber.toLowerCase().indexOf(query) >= 0)
                       }));
                   }}/>
            <DataGrid $gridData={$gridData} columns={{
                name: {
                    title: 'Name',
                    headerStyle: {},
                    cellStyle: {},
                    width: '45%',
                    renderer: ({value}) => <label>{value}</label>
                },
                email: {
                    title: 'E-Mail',
                    headerStyle: {},
                    cellStyle: {},
                    width: '25%',
                    renderer: ({value}) => <label>{value}</label>
                },
                phoneNumber: {
                    title: 'Phone Number',
                    headerStyle: {},
                    cellStyle: {},
                    width: '25%',
                    renderer: ({value}) => <label>{value}</label>
                },
                id: {
                    title: '',
                    headerStyle: {},
                    cellStyle: {},
                    width: '5%',
                    renderer: ({value, row}) => <SelectCellRenderer row={row} $selectedUser={$selectedUser}/>
                }
            }} columnKey={'id'}/>
            <div style={{marginTop: 10, display: 'flex', justifyContent: 'flex-end'}}>
                <StoreValueRenderer store={$selectedUser} selector={s => s.length} render={(value: number) => {
                    return <div style={{flexGrow: 1}}>{`${value} User${value > 1 ? 's' : ''} selected`}</div>
                }}/>
                <button style={{marginRight: 10}} onClick={async () => {
                    const selectedUser = $selectedUser.get();
                    await closePanel([...selectedUser]);
                }}>Update
                </button>
                <button onClick={async () => {
                    await closePanel(false);
                }}>Cancel
                </button>
            </div>
        </div>
    </div>
}

function SelectCellRenderer(props: { row: User, $selectedUser: Store<User[]> }) {
    const {row, $selectedUser} = props;
    const isChecked = useStoreValue($selectedUser, (s: User[]) => s.findIndex(s => s.id === row.id) >= 0);
    const [, _setRefreshUi] = useState(0);

    function refreshUI() {
        _setRefreshUi(Math.random());
    }

    return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
    }}>
        <input key={row.id} type={'checkbox'} checked={isChecked} onChange={(event) => {
            $selectedUser.set(produce(old => {
                const findIndex = old.findIndex(s => s.id === row.id);
                if (findIndex < 0) {
                    old.push(row);
                } else {
                    old.splice(findIndex, 1);
                }
            }));
            setTimeout(refreshUI, 100);
        }}/>
    </div>
}