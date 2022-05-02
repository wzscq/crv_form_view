import { useCallback, useEffect, useState } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import {Space,Transfer,Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { modiData,removeErrorField } from '../../../../../redux/dataSlice';
import {
    FRAME_MESSAGE_TYPE,
    CC_COLUMNS,
    SAVE_TYPE,
    CASCADE_TYPE
} from '../../../../../utils/constant';
import './index.css';

export default function TransferControl({control,field,sendMessageToParent}){
    const {origin,item:frameItem}=useSelector(state=>state.frame);
    const dispatch=useDispatch();
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectValueError=(state,field)=>state.data.errorField[field];
    const selectCascadeParentValue=(state,field,cascade)=>{
        console.log('selectCascadeParentValue',field,cascade);
        if(cascade&&cascade.parentField){
            if(state.data.modified[cascade.parentField]){
                const modifiedValue=state.data.modified[cascade.parentField];
                return modifiedValue.value?modifiedValue.value:modifiedValue;
            } /*else if(state.data.origin[cascade.parentField]) {
                const orginValue=state.data.origin[cascade.parentField];
                return orginValue.value?orginValue.value:undefined;
            }*/
        }
        return undefined;
    }

    const selectValue=createSelector(
        selectOriginValue,
        selectModifiedValue,
        selectValueError,
        selectCascadeParentValue,
        (originValue,modifiedValue,valueError,cascadeParentValue)=>{
            return {originValue,modifiedValue,valueError,cascadeParentValue}
        }
    );
    const {originValue,modifiedValue,valueError,cascadeParentValue}=useSelector(state=>selectValue(state.data,field.field,control.cascade));
    const [targetKeys,setTargetKeys]=useState(originValue?originValue.list.map(item=>item.id):[]);
    const [options,setOptions]=useState([]);
    console.log('originValue',field.field,originValue,cascadeParentValue);

    const getQueryParams=useCallback((field,control)=>{
        console.log('getQueryParams',control);
        let filter=undefined;
        if(control.cascade){
            //情况1
            if(control.cascade.type===CASCADE_TYPE.MANY2ONE){
                if(control.cascade.relatedField){
                    if(cascadeParentValue){
                        filter={[control.cascade.relatedField]:cascadeParentValue};        
                    }          
                } else {
                    console.error('do not provide related field.');    
                }
            } /*else if(control.cascade.type===CASCADE_TYPE.MANY2MANY){
                
            }*/else {
                console.error('not supported cascade type:',control.cascade.type);
            }
        }

        if(control.relatedFilter){
            if(filter){
                filter={'Op.and':[control.relatedFilter,{...filter}]};
            } else {
                filter=control.relatedFilter;
            }
        }
        
        return {
            modelID:field.relatedModelID,
            fields:control.fields,
            filter:filter,
            pagination:{current:1,pageSize:500}
        }
    },[cascadeParentValue]);

    const loadOptions=useCallback(()=>{
        const queryParams=getQueryParams(field,control);
        if(queryParams){
            const frameParams={
                frameType:frameItem.frameType,
                frameID:frameItem.params.key,
                dataKey:field.field,
                origin:origin
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
        }
    },[getQueryParams,sendMessageToParent,control,field,origin,frameItem]);

    useEffect(()=>{
        const queryResponse=(event)=>{
            const {type,dataKey,data}=event.data;
            if(type===FRAME_MESSAGE_TYPE.QUERY_RESPONSE&&
                dataKey===field.field&&
                data.list){
                setOptions(data.list);    
                //setOptions(data.list?data.list:[]);
            }
        }
        window.addEventListener("message",queryResponse);
        return ()=>{
            window.removeEventListener("message",queryResponse);
        }
    },[field]);

    useEffect(()=>{
        console.log('loadOptions');
        setOptions([]);
        loadOptions();
    },[loadOptions]);

    const handleChange = targetKeys => {
        console.log('handleChange',targetKeys);
        const saveType={};
        saveType[CC_COLUMNS.CC_SAVE_TYPE]=SAVE_TYPE.CREATE;
        const addList=targetKeys.map(key=>{
            const originItem=originValue?originValue.list.find(item=>item.id===key):null;
            if(originItem){
                return {id:key};
            } else {
                return {id:key,...saveType};
            }
        });

        console.log('addList',addList);

        saveType[CC_COLUMNS.CC_SAVE_TYPE]=SAVE_TYPE.DELETE;
        const delList=originValue?originValue.list.map(item=>{
            const newItem=addList.find(element=>element.id===item.id);
            if(newItem){
                return {id:item.id};
            } else {
                return {id:item.id,...saveType};
            }
        }):[];

        console.log('delList',delList);

        const list = addList.concat(delList).filter(item=>item[CC_COLUMNS.CC_SAVE_TYPE]);

        console.log('list',list);

        setTargetKeys(targetKeys);
        dispatch(modiData({
            field:field.field,
            modification:{
                modelID:field.relatedModelID,
                fieldType:field.fieldType,
                associationModelID:field.associationModelID,
                list:list
            },
            modified:{
                /*modelID:field.relatedModelID,
                fieldType:field.fieldType,
                associationModelID:field.associationModelID,*/
                list:targetKeys
            }
        }));

        if(valueError){
            dispatch(removeErrorField(field.field));
        }
    };

    //获取文本输入框的标签，如果form控件配置了label属性则直接使用，
    //如果控件没有配置label属性，则取字段配置的字段name
    const label=control.label?control.label:(field?field.name:"");
    const optionLabel=control.optionLabel?control.optionLabel:'id';

    const dataSource=options.map(item=>({
        key:item.id,
        title:item[optionLabel],
        description: item[optionLabel],
        chosen:true
    }));

    const filterOption = (inputValue, option) => option.description.indexOf(inputValue) > -1;
    let transferControl=(
        <Transfer
            dataSource={dataSource}
            showSearch
            filterOption={filterOption}
            targetKeys={targetKeys}
            onChange={handleChange}
            render={item => item.title}
            disabled={control.disabled}
            status={valueError?'error':null}
        />
    );
    
    transferControl=valueError?(
        <Tooltip title={valueError.message}>
            {transferControl}
        </Tooltip>):transferControl;
    
    const className='control-transfer';

    return (
        <div className={className}>
            <Space size={2} direction="vertical" style={{width:'100%'}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.required?(<span style={{color:'red'}}>*</span>):null}
                    {label}
                </div>
                {transferControl}
            </Space>
        </div>
    )
}