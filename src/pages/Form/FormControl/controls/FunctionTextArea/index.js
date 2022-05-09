import {Input,Space} from 'antd';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

const {TextArea} = Input;

export default function FunctionTextArea({control}){
    const relatedData=useSelector(state=>{
        const data={};
        if( control.fields && Array.isArray(control.fields)){
            control.fields.forEach(field => {
                data[field]=state.data.data.modified[field];
            });
        } 
        return data;
    });

    const createFunc=useCallback(()=>{
        return Function('"use strict";return (function(data){'+control.function+'})')();
    },[control]);

    const func=createFunc();

    const textControl=(
        <TextArea  
            value={func(relatedData)} 
            rows={control.textRowCount}
            disabled={true} 
        />
    );

    return (
        <div>
            <Space size={2} direction="vertical" style={{width:'100%'}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.label}
                </div>
                {textControl}
            </Space>
        </div>
    );
}