import {getMicroEnd} from "@microend/lib";
import {StoreValueRenderer, useStore, useStoreListener} from "./useStore";
import {AnimatePresence, motion} from "framer-motion";
import {ReactElement, useState} from "react";
import {original, produce} from "immer";
import {nanoid} from "nanoid";
const me = getMicroEnd();
const border = '1px solid rgba(0,0,0,0.1)';

interface Tree {
    parent: Tree | undefined,
    name: string
    id: string,
    children: Tree[]
}

const getPath = (tree: Tree): string => {
    if (tree.parent) {
        return getPath(tree.parent) + '/' + tree.id;
    }
    return tree.id;
}
function flatTree(tree:Tree[],result:Tree[]){
    tree.forEach(leaf => {
        result.push(leaf);
        const trees = flatTree(leaf.children,[]);
        result = result.concat(trees);
    });
    return result;
}
function App() {
    const $selectedTab = useStore<'roles' | 'users'>('roles');
    const $showPanel = useStore<ReactElement | undefined>(undefined);
    const $dataTree = useStore<Tree>({parent: undefined, name: '.', id: '.', children: []});
    const $flatTree = useStore<Tree[]>([]);
    useStoreListener($dataTree,s => s ,(param:Tree) => {
        const trees:Tree[] = flatTree([param],[]);
        $flatTree.set(trees);
    },[]);
    function showPanel(factory: (close: (result: any) => void) => ReactElement): Promise<any> {
        return new Promise(resolve => {
            const element: ReactElement = factory(resolve);
            $showPanel.set(element);
        }).then(result => {
            $showPanel.set(undefined);
            return Promise.resolve(result);
        });
    }

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
                                $dataTree.set(produce(s => {
                                    const child:Tree = {
                                        parent : original(s),
                                        name : '',
                                        id : nanoid(),
                                        children : []
                                    }
                                    s.children.push(child);
                                }));
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
            <StoreValueRenderer store={$flatTree} selector={s => s} render={(tree:Tree[]) => {
                return <div style={{height: '100%', backgroundColor: '#FEFEFE'}}>

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

function RoleForm(params: { close: (result: any) => void }) {
    const {close} = params;
    return <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{fontSize: '1.2rem', borderBottom: border, padding: '5px 10px'}}>Add New Roles</div>
        <div style={{padding: 10, backgroundColor: '#F9F9F9'}}>
            <label style={{display: 'flex', flexDirection: 'column', marginBottom: 10}}>
                <div>Role Name</div>
                <input style={{border: border, padding: '5px 10px', width: 200, fontSize: '1rem'}}/>
            </label>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <div style={{
                    backgroundColor: 'white',
                    border,
                    padding: '5px 10px',
                    borderRadius: 5,
                    cursor: 'pointer',
                    marginRight: 5
                }} onClick={() => {
                    close('');
                }}>
                    Save
                </div>
                <div style={{backgroundColor: 'white', border, padding: '5px 10px', borderRadius: 5, cursor: 'pointer'}}
                     onClick={() => {
                         close(false);
                     }}>
                    Cancel
                </div>
            </div>
        </div>
    </div>
}

export default App
