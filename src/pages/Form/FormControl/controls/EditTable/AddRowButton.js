import { Button, Tooltip } from 'antd';
import {PlusOutlined} from '@ant-design/icons';

export default function AddRowButton({disabled,colNo,onAddNewRow}){
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
            <Tooltip title="add new row">
                <Button disabled={disabled} size="small" onClick={onAddNewRow} icon={<PlusOutlined />}/>
            </Tooltip>
        </div>
    );
}