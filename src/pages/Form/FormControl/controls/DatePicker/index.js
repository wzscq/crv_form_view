import { createSelector } from '@reduxjs/toolkit';
import {DatePicker,Space,Tooltip } from 'antd';
import { useEffect,useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';

import { modiData,removeErrorField } from '../../../../../redux/dataSlice';
//import './index.css';

export default function DatePickerControl({control,field}){
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
    
    const onChange=(date,dateString)=>{
        console.log(dateString);
        dispatch(modiData({field:field.field,modified:dateString,modification:dateString}));
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
    let value=modifiedValue!==undefined?modifiedValue:originValue;
    if(value&&value.length>0){
        value=moment(value);
    }
    
    let datePickerControl=(
        <DatePicker  
            value={value} 
            disabled={control.disabled} 
            onChange={onChange}
            ref={inputRef}
            status={valueError?'error':null}
            />
    );

    datePickerControl=valueError?(
        <Tooltip title={valueError.message}>
            {datePickerControl}
        </Tooltip>):datePickerControl;

    //(modifiedValue!==undefined)?'control-text-modified':
    const className=valueError?'control-text-error':'control-text-normal';

    return (
        <div className={className}>
            <Space size={2} direction="vertical" style={{width:'100%'}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.required?(<span style={{color:'red'}}>*</span>):null}
                    {label}
                </div>
                {datePickerControl}
            </Space>
        </div>
    );
}