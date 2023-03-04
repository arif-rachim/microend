import {PropsWithChildren} from "react";

export function Visible(props: PropsWithChildren<{ if?: boolean }>) {
    return <>
        {props.if && props.children}
    </>
}