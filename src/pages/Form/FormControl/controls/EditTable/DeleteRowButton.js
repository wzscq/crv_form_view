import { Button, Tooltip } from 'antd';
import {MinusOutlined} from '@ant-design/icons';

export default function DeleteRowButton({disabled,rowNo,colNo,onDeleteRow}){
    const wrapperStyle={
        gridColumnStart:colNo+1,
        gridColumnEnd:colNo+2,
        gridRowStart:1,
        gridRowEnd:2,
        backgroundColor:"#FFFFFF",
        borderBottom:'1px solid #d9d9d9',
        borderLeft:'1px solid #d9d9d9',
        textAlignment:'center',
        padding:2}

    return (
        <div style={wrapperStyle}>
            <Tooltip title="create new row">
                <Button size="small" disabled={disabled} onClick={()=>onDeleteRow(rowNo)} icon={<MinusOutlined />}/>
            </Tooltip>
        </div>
    );
}