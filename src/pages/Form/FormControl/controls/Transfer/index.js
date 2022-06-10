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
import I18nLabel from '../../../../../component/I18nLabel';

import './index.css';

export default function TransferControl({dataPath,control,field,sendMessageToParent}){
    const {origin,item:frameItem}=useSelector(state=>state.frame);
    const dispatch=useDispatch();
    
    const selectOriginValue=(data,dataPath,field)=>{
        let originNode=data.origin;
        for(let i=0;i<dataPath.length;++i){
            originNode=originNode[dataPath[i]];
            if(!originNode){
                return undefined;
            }
        }
        return originNode[field];
    };
    
    const selectUpdatedValue=(data,dataPath,field)=>{
        let updatedNode=data.updated;
        for(let i=0;i<dataPath.length;++i){
            updatedNode=updatedNode[dataPath[i]];
            if(!updatedNode){
                return undefined;
            }
        }
        return updatedNode[field];
    };

    const selectValueError=(data,dataPath,field)=>{
        const errFieldPath=dataPath.join('.')+'.'+field;
        return data.errorField[errFieldPath];
    };

    const selectCascadeParentValue=(data,dataPath,field,cascade)=>{
        if(cascade&&cascade.parentField){
            let updatedNode=data.updated;
            for(let i=0;i<dataPath.length;++i){
                updatedNode=updatedNode[dataPath[i]];
                if(!updatedNode){
                    return undefined;
                }
            }
            
            if(updatedNode[cascade.parentField]){
                const cascadeValue=updatedNode[cascade.parentField];
                return cascadeValue.value?cascadeValue.value:cascadeValue;
            }
        }
        return undefined;
    };

    const selectValue=createSelector(
        selectOriginValue,
        selectUpdatedValue,
        selectValueError,
        selectCascadeParentValue,
        (originValue,updatedValue,valueError,cascadeParentValue)=>{
            return {originValue,updatedValue,valueError,cascadeParentValue};
        }
    );
    
    const {originValue,updatedValue,valueError,cascadeParentValue}=useSelector(state=>selectValue(state.data,dataPath,field.field,control.cascade));

    const [targetKeys,setTargetKeys]=useState(updatedValue?updatedValue.list.map(item=>item.id):[]);
    const [options,setOptions]=useState([]);
    
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
        setOptions([]);
        loadOptions();
    },[loadOptions]);

    const handleChange = targetKeys => {
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

        saveType[CC_COLUMNS.CC_SAVE_TYPE]=SAVE_TYPE.DELETE;
        const delList=originValue?originValue.list.map(item=>{
            const newItem=addList.find(element=>element.id===item.id);
            if(newItem){
                return {id:item.id};
            } else {
                return {id:item.id,...saveType};
            }
        }):[];

        const list = addList.concat(delList).filter(item=>item[CC_COLUMNS.CC_SAVE_TYPE]);

        setTargetKeys(targetKeys);
    
        dispatch(modiData({
            dataPath:dataPath,
            field:field.field,
            updated:{
                modelID:field.relatedModelID,
                fieldType:field.fieldType,
                associationModelID:field.associationModelID,
                list:targetKeys.map(id=>options.find(item=>item.id===id))
            },
            update:{
                modelID:field.relatedModelID,
                fieldType:field.fieldType,
                associationModelID:field.associationModelID,
                list:list
            }}));
        
        if(valueError){
            const errFieldPath=dataPath.join('.')+'.'+field.field;
            dispatch(removeErrorField(errFieldPath));
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
            style={{maxHeight:control.maxHeight?control.maxHeight:"100%"}}
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
        <Tooltip title={<I18nLabel label={valueError.message}/>}>
            {transferControl}
        </Tooltip>):transferControl;
    
    const className='control-transfer';

    return (
        <div className={className}>
            <Space size={2} direction="vertical" style={{width:'100%'}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.required?(<span style={{color:'red'}}>*</span>):null}
                    <I18nLabel label={label}/>
                </div>
                {transferControl}
            </Space>
        </div>
    )
}