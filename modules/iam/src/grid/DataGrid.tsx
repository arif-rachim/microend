import {Store, StoreValueRenderer} from "../useStore";
import {border} from "../tree/DataTree";
import {CSSProperties, ReactElement} from "react";

interface ColumnType<T> {
    title: string,
    width: number | string,
    headerStyle: CSSProperties,
    cellStyle: CSSProperties,
    renderer: (params: { value: any, row: T, rowIndex: number, colIndex: number, rows: T[] }) => ReactElement
}

export function DataGrid<T, Columns extends Partial<{ [k in keyof T]: ColumnType<T> }>>(props: { $gridData: Store<T[]>, columns: Columns, columnKey: keyof T }) {
    const {columns, $gridData, columnKey} = props;
    return <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{
            display: 'flex',
            backgroundColor: '#F2F2F2',
            borderBottom: border,
            borderTop: border,
            padding: '3px 5px'
        }}>
            {Object.keys(columns).map((key) => {
                const column: ColumnType<T> = (columns as any)[key];
                const style = {
                    ...column.headerStyle,
                    flexGrow: 0,
                    flexShrink: 0,
                    width: column.width
                }
                return <div key={key} style={style}>{column.title}</div>
            })}
        </div>
        <StoreValueRenderer store={props.$gridData} selector={s => s} render={(rows: T[]) => {
            return <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                {rows.map((row: T, rowIndex) => {
                    const k: string = row[columnKey] as any;
                    return <div key={k} style={{
                        display: 'flex',
                        backgroundColor: '#F2F2F2',
                        borderBottom: border,
                        borderTop: border,
                        padding: '3px 5px'
                    }}>
                        {Object.keys(columns).map((key, colIndex) => {
                            const column: ColumnType<T> = (columns as any)[key];
                            const value = (row as any)[key];
                            const style = {
                                ...column.cellStyle,
                                flexGrow: 0,
                                flexShrink: 0,
                                width: column.width
                            }
                            return <div key={key} style={style}>{column.renderer({
                                value,
                                row,
                                rows,
                                colIndex,
                                rowIndex
                            })}</div>
                        })}
                    </div>
                })}
            </div>
        }}/>
    </div>
}