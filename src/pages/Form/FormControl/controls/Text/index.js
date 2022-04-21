import { createSelector } from '@reduxjs/toolkit';
import {Input,Space,Tooltip } from 'antd';
import { useEffect,useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { modiData,removeErrorField } from '../../../../../redux/dataSlice';
//import './index.css';

export default function Text({control,field}){
    const dispatch=useDispatch();
    const inputRef = useRef(null);
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectValueError=(state,field)=>state.data.errorField[field];
    const selectValue=createSelector(selectOriginValue,selectModifiedValue,selectValueError,(originValue,modifiedValue,valueError)=>{
        return {originValue,modifiedValue,valueError}
    })
    
    const {originValue,modifiedValue,valueError}=useSelector(state=>selectValue(state.data,field.field));

    console.log('valueError:',valueError);
    
    const onChange=(e)=>{
        console.log(e.target.value);
        dispatch(modiData({field:field.field,modified:e.target.value,modification:e.target.value}));
        if(valueError){
            dispatch(removeErrorField(field.field));
        }
    }

    useEffect(()=>{
        if(inputRef.current){
            inputRef.current.focus({
                cursor: 'end',
            });
        }
    },[valueError,inputRef]);

    //获取文本输入框的标签，如果form控件配置了label属性则直接使用，
    //如果控件没有配置label属性，则取字段配置的字段name
    const label=control.label?control.label:(field?field.name:"");
    
    let inputControl=(
        <Input  
            placeholder={control.placeholder?control.placeholder:""} 
            value={modifiedValue!==undefined?modifiedValue:originValue} 
            allowClear
            disabled={control.disabled} 
            onChange={onChange}
            ref={inputRef}
            status={valueError?'error':null}
            />
    );

    inputControl=valueError?(
        <Tooltip title={valueError.message}>
            {inputControl}
        </Tooltip>):inputControl

    //(modifiedValue!==undefined)?'control-text-modified':
    const className=valueError?'control-text-error':'control-text-normal';

    return (
        <div className={className}>
            <Space size={2} direction="vertical" style={{width:'100%'}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.required?(<span style={{color:'red'}}>*</span>):null}
                    {label}
                </div>
                {inputControl}
            </Space>
        </div>
    )
}