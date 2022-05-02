import { getControl } from "./controls";

export default function TableCell(props){
    const {colNo}=props;
    const wrapperStyle={
        gridColumnStart:colNo+1,
        gridColumnEnd:colNo+2,
        gridRowStart:1,
        gridRowEnd:2,
        backgroundColor:"#FFFFFF",
        borderBottom:'1px solid #d9d9d9',
        borderLeft:'1px solid #d9d9d9',
        padding:2};

    return (
        <div style={wrapperStyle} >
            {getControl(props)}
        </div>
    );
}