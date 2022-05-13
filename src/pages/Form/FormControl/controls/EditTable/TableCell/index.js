//import { getControl } from "./controls";

import {getControl} from '../../index';

export default function TableCell(props){
    const {colNo,dataPath,field,sendMessageToParent}=props;
    const wrapperStyle={
        gridColumnStart:colNo+1,
        gridColumnEnd:colNo+2,
        gridRowStart:1,
        gridRowEnd:2,
        backgroundColor:"#FFFFFF",
        borderBottom:'1px solid #d9d9d9',
        borderLeft:'1px solid #d9d9d9',
        padding:1};
    return (
        <div style={wrapperStyle} >
            {getControl({...field,inline:true},field,sendMessageToParent,dataPath)}
        </div>
    );
}