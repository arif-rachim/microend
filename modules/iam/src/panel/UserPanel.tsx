import {db, User} from "../Database";
import {StoreValue, useStore} from "../useStore";
import {nanoid} from "nanoid";
import produce from "immer";

export function UserPanel<T>(props: { closePanel: <T>(val: (User | false)) => void }) {
    const {closePanel} = props;
    const $form = useStore<User>({
        userId: '',
        active: false,
        id: nanoid(),
        name: '',
        email: '',
        phoneNumber: '',
        roles: ''
    })

    return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', width: 300, backgroundColor: 'white'}}>
            <div style={{display: 'flex', flexDirection: 'column', padding: 10}}>
                <label style={{display: 'flex', margin: 5, boxSizing: 'border-box'}}>
                    <span style={{
                        width: 120,
                        flexShrink: 0,
                        flexGrow: 0,
                        textAlign: 'right',
                        marginRight: 5
                    }}>User ID :</span>
                    <StoreValue store={$form} selector={s => s.userId} property={'value'}>
                        <input style={{flexGrow: 1}} onChange={(e) => {
                            $form.set(produce(s => {
                                s.userId = e.target.value
                            }))
                        }}/>
                    </StoreValue>
                </label>
                <label style={{display: 'flex', margin: 5, boxSizing: 'border-box'}}>
                    <span style={{
                        width: 120,
                        flexShrink: 0,
                        flexGrow: 0,
                        textAlign: 'right',
                        marginRight: 5
                    }}>Name :</span>
                    <StoreValue store={$form} selector={s => s.name} property={'value'}>
                        <input style={{flexGrow: 1}} onChange={(e) => {
                            $form.set(produce(s => {
                                s.name = e.target.value
                            }))
                        }}/>
                    </StoreValue>
                </label>
                <label style={{display: 'flex', margin: 5, boxSizing: 'border-box'}}>
                    <span style={{
                        width: 120,
                        flexShrink: 0,
                        flexGrow: 0,
                        textAlign: 'right',
                        marginRight: 5
                    }}>E-mail :</span>
                    <StoreValue store={$form} selector={s => s.email} property={'value'}>
                        <input style={{flexGrow: 1}} onChange={(e) => {
                            $form.set(produce(s => {
                                s.email = e.target.value
                            }))
                        }}/>
                    </StoreValue>
                </label>
                <label style={{display: 'flex', margin: 5, boxSizing: 'border-box'}}>
                    <span style={{width: 120, flexShrink: 0, flexGrow: 0, textAlign: 'right', marginRight: 5}}>Phone Number :</span>
                    <StoreValue store={$form} selector={s => s.phoneNumber} property={'value'}>
                        <input style={{flexGrow: 1}} onChange={(e) => {
                            $form.set(produce(s => {
                                s.phoneNumber = e.target.value
                            }))
                        }}/>
                    </StoreValue>
                </label>
            </div>
            <div style={{
                display: 'flex',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                padding: 10,
                justifyContent: 'flex-end'
            }}>
                <button style={{marginRight: 5}} onClick={async () => {
                    const data = {...$form.get()};
                    if (data.userId === '') {
                        alert('User Id required');
                        return;
                    }
                    if (data.name === '') {
                        alert('Name is required');
                        return;
                    }
                    if (data.email === '') {
                        alert('E-Mail is required');
                        return;
                    }
                    if (data.phoneNumber === '') {
                        alert('Phone Number is required');
                        return;
                    }
                    data.active = true;
                    await db.users.put(data)
                    closePanel(data);
                }}>Register
                </button>
                <button onClick={() => {
                    closePanel(false)
                }}>Cancel
                </button>
            </div>
        </div>
    </div>;
}