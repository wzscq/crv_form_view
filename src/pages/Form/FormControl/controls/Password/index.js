import { createSelector } from '@reduxjs/toolkit';
import {Input,Space,Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {useRef,useEffect} from 'react';

import { modiData,removeErrorField } from '../../../../../redux/dataSlice';
import {encodePassword} from '../../../../../utils/passwordEncoder';
//import './index.css';
import { useState } from 'react';

export default function Password({control,field}){
    const dispatch=useDispatch();
    const inputRef = useRef(null);
    const [value,setValue]=useState(undefined);
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectValueError=(state,field)=>state.data.errorField[field];
    const selectValue=createSelector(selectOriginValue,selectModifiedValue,selectValueError,(originValue,modifiedValue,valueError)=>{
        return {originValue,modifiedValue,valueError}
    })
    
    const {originValue,valueError}=useSelector(state=>selectValue(state.data,field.field));

    const onChange=(e)=>{
        console.log(e.target.value);
        setValue(e.target.value);
        let password=e.target.value;
        if(password){
            password=encodePassword(password);
        }
        dispatch(modiData({field:field.field,modified:password,modification:password}));
        if(valueError){
            dispatch(removeErrorField(field.field));
        }
    }

    //获取文本输入框的标签，如果form控件配置了label属性则直接使用，
    //如果控件没有配置label属性，则取字段配置的字段name
    const label=control.label?control.label:(field?field.name:"");

    let passwordControl=(
        <Input.Password  
            value={value!==undefined?value:originValue} 
            disabled={control.disabled} 
            onChange={onChange}
            status={valueError?'error':null}
            ref={inputRef}
        />
    );

    useEffect(()=>{
        if(inputRef.current){
            inputRef.current.focus({
                cursor: 'end',
            });
        }
    },[valueError,inputRef]);
    
    passwordControl=valueError?(
        <Tooltip title={valueError.message}>
            {passwordControl}
        </Tooltip>):passwordControl

    //modifiedValue?'control-password-modified':
    const className='control-password-normal';

    return (
        <div className={className}>
            <Space size={2} direction="vertical" style={{width:'100%'}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.required?(<span style={{color:'red'}}>*</span>):null}
                    {label}
                </div>
                {passwordControl}
            </Space>
        </div>
    )
}