import { createSelector } from '@reduxjs/toolkit';
import {Select,Space,Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { modiData,removeErrorField } from '../../../../../../redux/dataSlice';
import './index.css';

const { Option } = Select;

export default function SingleSelectForOptions({control,field}){
    const dispatch=useDispatch();
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectValueError=(state,field)=>state.data.errorField[field];
    const selectValue=createSelector(selectOriginValue,selectModifiedValue,selectValueError,(originValue,modifiedValue,valueError)=>{
        return {originValue,modifiedValue,valueError}
    });
    
    const {originValue,modifiedValue,valueError}=useSelector(state=>selectValue(state.data,field.field));

    console.log('valueError:',valueError);
    
    const onChange=(value)=>{
        if(value===undefined){
            //这里主要是考虑值被删除的时候，将值置为空，
            //否则删除后由于modifiedValue为undefind，将显示originValue，无法实现删除值的逻辑
            value=null;
        }
        dispatch(modiData({field:field.field,modified:value,modification:value}));
        if(valueError){
            dispatch(removeErrorField(field.field));
        }
    }

    //获取文本输入框的标签，如果form控件配置了label属性则直接使用，
    //如果控件没有配置label属性，则取字段配置的字段name
    const label=control.label?control.label:(field?field.name:"");

    const options=control.options.map((item,index)=>
    (<Option key={index} value={item.value}>{item.label}</Option>));
    
    let selectControl= (<Select  
        placeholder={control.placeholder?control.placeholder:""} 
        value={modifiedValue!==undefined?modifiedValue:originValue} 
        allowClear
        disabled={control.disabled} 
        onChange={onChange}
        status={valueError?'error':null}
        >
        {options}
    </Select>);

    selectControl=valueError?(
        <Tooltip title={valueError.message}>
            {selectControl}
        </Tooltip>):selectControl;
    //(modifiedValue!==undefined)?'control-text-modified':
    const className=valueError?'control-select-error':'control-select-normal';

    return (
        <div className={className}>
            <Space size={2} direction="vertical" style={{width:'100%'}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.required?(<span style={{color:'red'}}>*</span>):null}
                    {label}
                </div>
                {selectControl}
            </Space>
        </div>
    )
}