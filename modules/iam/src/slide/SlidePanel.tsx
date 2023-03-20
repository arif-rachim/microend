import {
    Component,
    CSSProperties,
    ErrorInfo,
    ForwardedRef,
    forwardRef,
    ReactElement,
    useCallback,
    useImperativeHandle,
    useRef
} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {useStore, useStoreValue,noNull} from "@microend/utils";
import {GiHammerBreak} from "react-icons/gi";
import {nanoid} from "nanoid";


export type FactoryFunctionConfig = {
    position?: 'top' | 'left' | 'right' | 'bottom';
    isPopup?: boolean; // is popup meaning that the previous panel should not hide
}

const slidePanelStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    boxSizing: 'border-box'
}

function renderSlidePanels(props: { panels: { id: string, element: ReactElement, config: FactoryFunctionConfig }[] }) {
    const panels = props.panels;
    return panels.map((p, index, source) => {
        let initial: any = {bottom: '-100%', width: '100%'};
        let animate: any = {bottom: 0};
        let exit: any = {bottom: '-100%'};
        if (p.config.position === 'top') {
            initial = {top: '-100%', width: '100%'};
            animate = {top: 0};
            exit = {top: '-100%'};
        }
        if (p.config.position === 'right') {
            initial = {right: '-100%', height: '100%'};
            animate = {right: 0};
            exit = {right: '-100%'};
        }
        if (p.config.position === 'left') {
            initial = {left: '-100%', height: '100%'};
            animate = {left: 0};
            exit = {left: '-100%'};
        }
        const isLastIndex = index === source.length - 1;

        if (!isLastIndex) {
            const isNextPanelIsPopup = panels[index + 1].config.isPopup;
            if (!isNextPanelIsPopup) {
                animate = exit;
            }
        }
        return <motion.div style={slidePanelStyle}
                           key={p.id}>
            <OverlayPanel blurBackground={!p.config.isPopup}/>
            <motion.div style={{position: 'absolute'}} initial={initial}
                        animate={animate} exit={exit} transition={{bounce: 0}}>
                {p.element}
            </motion.div>
        </motion.div>
    })
}


const overlayStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backdropFilter: 'blur(5px) contrast(60%)',
    WebkitBackdropFilter: 'blur(5px) contrast(60%)',
}

const overlayStyleNoBlur: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backdropFilter: 'blur(0.1px) contrast(60%)',
    WebkitBackdropFilter: 'blur(0.1px) contrast(60%)',
}

function OverlayPanel(props: { blurBackground: boolean }) {
    return <motion.div style={props.blurBackground ? overlayStyle : overlayStyleNoBlur}
                       initial={{opacity: 0}}
                       animate={{opacity: 1}}
                       exit={{opacity: 0}}/>
}

export type FactoryFunction<T> = (closePanel: (val: T) => void) => ReactElement;

interface SlidePanelRef {
    showPanel: <T>(factory: FactoryFunction<T>, config?: FactoryFunctionConfig | undefined) => Promise<T>
}

export function useSlidePanel(): [<T>(factory: FactoryFunction<T>, config?: FactoryFunctionConfig | undefined) => Promise<T>, ReactElement] {
    const ref = useRef<SlidePanelRef>(null);
    const showPanel: <T>(factory: FactoryFunction<T>, config?: FactoryFunctionConfig | undefined) => Promise<T> = (factory, config) => {
        return ref.current!.showPanel(factory, config);
    }
    return [showPanel, <SlidePanel ref={ref}/>]
}

const SlidePanel = forwardRef(function SlidePanel(props: {}, ref: ForwardedRef<SlidePanelRef>) {

    const panelStore = useStore<({ id: string, element: ReactElement, config: FactoryFunctionConfig })[]>([]);

    const showPanel = useCallback(function showSlidePanel<T>(factory: FactoryFunction<T>, config?: FactoryFunctionConfig) {
        return new Promise<T>(resolve => {
            const id = nanoid();

            function closePanel(value: T) {
                panelStore.set(s => {
                    return s.filter(s => s.id !== id)
                })
                resolve(value);
            }

            const element = factory(closePanel);
            const componentConfig: FactoryFunctionConfig = noNull(config, {position: 'top', isPopup: false});
            panelStore.set(s => ([...s, {id, config: componentConfig, element}]));
        })
    }, [panelStore]);
    useImperativeHandle(ref, () => {
        return {
            showPanel
        }
    })
    const slidePanel = useStoreValue(panelStore, param => param);
    return <ErrorBoundary>
        <AnimatePresence>
            {renderSlidePanels({panels: slidePanel})}
        </AnimatePresence>
    </ErrorBoundary>
})


class ErrorBoundary extends Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {hasError: false, error: undefined};
    }

    static getDerivedStateFromError(error: any) {
        // Update state so the next render will show the fallback UI.
        console.log('WE HAVE ERROR ', error);
        return {hasError: true, error};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        // logErrorToMyService(error, errorInfo);
    }

    render() {
        const {error, hasError} = (this.state as any);
        if (hasError) {
            // You can render any custom fallback UI
            return <div style={{color: 'red', fontSize: 22}} title={error.message}><GiHammerBreak/></div>;
        }
        return (this.props as any).children;
    }
}