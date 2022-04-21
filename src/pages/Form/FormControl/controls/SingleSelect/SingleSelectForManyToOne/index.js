import {useCallback, useState} from 'react';
import { createSelector } from '@reduxjs/toolkit';
import {Select,Space,Tooltip } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { modiData,removeErrorField } from '../../../../../../redux/dataSlice';
import {FRAME_MESSAGE_TYPE} from '../../../../../../utils/constant';
import './index.css';

const { Option } = Select;

export default function SingleSelectForManyToOne({control,field,sendMessageToParent}){
    const dispatch=useDispatch();
    const {origin,item:frameItem}=useSelector(state=>state.frame);
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectValueError=(state,field)=>state.data.errorField[field];

    const selectValue=createSelector(selectOriginValue,selectModifiedValue,selectValueError,(originValue,modifiedValue,valueError)=>{
        return {originValue,modifiedValue,valueError}
    });
    const {originValue,modifiedValue,valueError}=useSelector(state=>selectValue(state.data,field.field));
    const [options,setOptions]=useState([]);
    
    console.log('originValue',originValue);

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

    const getFilter=(control,value)=>{
        const fieldsFilter=control.fields.map(element => {
            const tempFieldFilter={};
            tempFieldFilter[element.field]='%'+value+'%';
            return tempFieldFilter;
        });
        const op='Op.or';
        return {[op]:fieldsFilter};
    };

    const onSearch=useCallback((value)=>{
        const frameParams={
            frameType:frameItem.frameType,
            frameID:frameItem.params.key,
            dataKey:field.field,
            origin:origin
        };
        const queryParams={
            modelID:field.relatedModelID,
            fields:control.fields,
            filter:getFilter(control,value),
            pagination:{current:1,pageSize:500}
        };
        const message={
            type:FRAME_MESSAGE_TYPE.QUERY_REQUEST,
            data:{
                frameParams:frameParams,
                queryParams:queryParams
            }
        }
        console.log('TransferControl send query message',message);
        sendMessageToParent(message);
    },[frameItem,origin,sendMessageToParent,control,field]);

    useEffect(()=>{
        onSearch("");
    },[onSearch]);

    useEffect(()=>{
        const queryResponse=(event)=>{
            const {type,dataKey,data}=event.data;
            if(type===FRAME_MESSAGE_TYPE.QUERY_RESPONSE&&
                dataKey===field.field){
                console.log('queryResponse',data);
                setOptions(data.list);
            }
        }
        window.addEventListener("message",queryResponse);
        return ()=>{
            window.removeEventListener("message",queryResponse);
        }
    },[setOptions,field]);

    //获取文本输入框的标签，如果form控件配置了label属性则直接使用，
    //如果控件没有配置label属性，则取字段配置的字段name
    const label=control.label?control.label:(field?field.name:"");
    const optionLabel=control.optionLabel?control.optionLabel:'id';
    
    let hasOriginValue=false;
    const optionControls=options?options.map((item,index)=>{
        if(originValue&&item.id===originValue.value){
            hasOriginValue=true;
        }
        return (<Option key={index} value={item.id}>{item[optionLabel]}</Option>);
    }):[];

    if(hasOriginValue===false&&originValue&&originValue.list&&originValue.list.length>0){
        const item=originValue.list[0];
        optionControls.push(<Option key={'origin'} value={item.id}>{item[optionLabel]}</Option>);
    }

    let selectControl= (<Select  
        placeholder={control.placeholder?control.placeholder:""} 
        value={modifiedValue!==undefined?modifiedValue:(originValue?originValue.value:undefined)} 
        allowClear
        showSearch
        disabled={control.disabled} 
        onSearch={onSearch}
        onChange={onChange}
        filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0||
            option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }       
        status={valueError?'error':null}
        >
        {optionControls}
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
    );
}