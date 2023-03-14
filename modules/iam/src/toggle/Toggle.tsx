import {motion} from "framer-motion";

const border = '1px solid rgba(0,0,0,0.1)';

export function Toggle(props: { value: string, dataProvider: string[], onChange: (param: string) => void }) {
    const {dataProvider, value, onChange} = props;
    return <div style={{display: 'flex', flexDirection: 'row'}}>
        {dataProvider.map(s => {
            return <motion.div key={s} style={{border, padding: '3px 10px', cursor: 'pointer'}}
                               animate={{backgroundColor: value === s ? '#CCC' : '#FFF'}}
                               onClick={() => onChange(s)}>{s}</motion.div>
        })}
    </div>;
}
