import {
    cloneElement,
    DependencyList,
    PropsWithChildren,
    ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {noNull} from "./noNull";

type Listener<T> = (next: T, prev: T) => void

export interface Action {
    type: string,
    payload: unknown,

    [key: string]: any
}

type SetState<S> = (param: S | ((currentState: S) => S)) => void;

export interface Store<S> {
    addListener: (state: Listener<S>) => () => void,
    dispatch: (action: Action) => void,
    set: SetState<S>,
    get: () => S;
}

export function createStoreInitValue<T>(param: T): Store<T> {
    return {
        set: () => {
        }, dispatch: () => {
        }, addListener: () => () => {
        }, get: () => param
    };
}

export function useStore<S>(initializer: S | (() => S), reducer?: (action: Action) => (oldState: S) => S): Store<S> {

    const listenerRef = useRef<Listener<S>[]>([]);
    const reducerRef = useRef(reducer)
    reducerRef.current = reducer;

    const [initialState] = useState<S>(() => {
        let stateInitial = initializer;
        if (isFunction(initializer)) {
            stateInitial = (initializer as () => S)();
        }
        return stateInitial as S;
    });
    const stateRef = useRef<S>(initialState);
    const value = useCallback(function value() {
        return stateRef.current;
    }, []);

    const dispatch = useCallback(function dispatch(action: Action) {
        if (reducerRef.current === undefined) {
            throw new Error('You cannot use dispatch when there is no reducer defined in store')
        }
        const newState = reducerRef.current(action)(stateRef.current);
        if (newState === stateRef.current) {
            return;
        }
        const prevState = stateRef.current;
        stateRef.current = newState;
        listenerRef.current.forEach(l => l.call(null, newState, prevState));

    }, []);

    const setState = useCallback(function setState(param: S | ((param: S) => S)) {
        let newState: S = param as S;
        if (isFunction(param)) {
            const functionParam = param as (param: S) => S
            newState = functionParam(stateRef.current)
        }
        if (newState === stateRef.current) {
            return;
        }
        const prevState = stateRef.current;
        stateRef.current = newState;
        listenerRef.current.forEach(l => l.call(null, newState, prevState));
    }, []);

    const addListener = useCallback(function addListener(selector: (param: S, next: S) => void) {
        listenerRef.current.push(selector);
        return () => listenerRef.current = listenerRef.current.filter(l => l !== selector)
    }, []);

    return useMemo(() => ({
        dispatch,
        stateRef,
        addListener,
        set: setState,
        get: value
    }), [addListener, dispatch, setState, value]);
}

export function useStoreListener<T, S>(store: Store<T>, selector: (param: T) => S, listener: (next: S, prev?: S) => void, deps?: DependencyList | undefined) {

    const propsRef = useRef({selector, listener});
    propsRef.current = {selector, listener};
    deps = noNull(deps, []);
    useEffect(() => {
        const t: T = store.get();
        const next = propsRef.current.selector(t);
        propsRef.current.listener(next);
        return store.addListener((nextState: T, prevState: T) => {
            const {selector} = propsRef.current;
            const current = selector(prevState);
            const next = selector(nextState);
            if (!isMatch(next, current)) {
                propsRef.current.listener(next, current);
            }
        });
        // eslint-disable-next-line
    }, deps);
}

export function useStoreValue<T, S>(store: Store<T>, selector: (param: T) => S, deps?: DependencyList | undefined) {
    const [value, setValue] = useState<S>(() => selector(store.get()));
    useStoreListener(store, selector, (next) => {
        setValue(old => {
            if (arrayIsMatch(old, next)) {
                return old;
            }
            return next;
        })
    }, deps);
    return value;
}

function arrayIsMatch(next: unknown, prev: unknown) {
    if (Array.isArray(next) && Array.isArray(prev) && next.length === prev.length) {
        for (let i = 0; i < next.length; i++) {
            if (next[i] !== prev[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
}


function isFunction(functionToCheck: unknown) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

type Selector<T, S> = (param: T) => S;

interface StoreValueInjectorProps<T, S> {
    store: Store<T>,
    selector: Selector<T, S>,
    property: string | string[]
}

export function StoreValue<T, S>(props: PropsWithChildren<StoreValueInjectorProps<T, S>>) {
    const {store, property, selector, children} = props;
    type StoreValueType = ReturnType<typeof selector>;
    const value: StoreValueType = useStoreValue(store, (param) => selector(param), [selector]);
    const cp = (children as any).props;
    const childrenProps = {...cp};
    if (Array.isArray(property)) {
        if (Array.isArray(value) && property.length === value.length) {
            property.forEach((prop: string, index: number) => {
                childrenProps[prop] = value[index];
            })
        } else {
            console.error('Unable to match props (', property.join(','), ') against value : ', value)
        }
    } else {
        childrenProps[property] = value;
    }
    return cloneElement((children as any), childrenProps)
}

export function StoreValueRenderer<T, S>(props: { store: Store<T>, selector: Selector<T, S>, render: (value: S) => ReactElement }) {
    return <StoreValue store={props.store} selector={props.selector} property={'value'}>
        <Renderer renderer={props.render}/>
    </StoreValue>
}

function Renderer<T>(props: { renderer: (value: T) => ReactElement, value?: T }) {
    const value: any = props.value;
    return props.renderer(value);
}

const isMatch = (a: any, b: any) => {
    if (a === b) {
        return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        const arrayA = a as [];
        const arrayB = b as [];
        if (arrayA.length === arrayB.length) {
            for (let i = 0; i < arrayA.length; i++) {
                if (arrayA[i] !== arrayB[i]) {
                    return false;
                }
            }
            return true;
        }
    }
    return false;
}