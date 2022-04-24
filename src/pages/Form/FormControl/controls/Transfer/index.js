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
                return state.data.modified[cascade.parentField];
            } else if(state.data.origin[cascade.parentField]) {
                const orginValue=state.data.origin[cascade.parentField];
                return orginValue.value?orginValue.value:undefined;
            }
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
        /**
         * 这里因为考虑级联选择的逻辑，查询下拉选择项的处理方式会有差异
         * 在没有级联关系的情况下，直接根据检索条件查询关联表即可
         * 对于有级联关系的情况，需要按照级联关系的控制方式来确定数据查询逻辑，
         * 级联关系的字段有以下前提：
         * 级联关系中父子字段都是多对一关联字段，其中父字段p_id对应了关联表p，子字段c_id对应的关联表c,
         * 
         * 级联关系字段存在以下三种情况（目前程序仅实现前2个情况），
         * 情况1：在表c中存在多对一关联字段p_id对应关联表p。对于这种情况，在查询c表数据时，
         * 需要在查询条件中补充p_id=cascadeParentValue作为查询的先决条件。
         * 
         * 情况2：表c和表p存在多对多关联关系。对于这种情况，需要将查询c表的操作转换为查询p表的操作，
         * 同时在查询p表操作时将关联到c表的多对多字段中补充对c对应字段的查询。
         *
         * 情况3：有另外一个表d，表d中存在两个多对一关联字段p_id和c_id，其中p_id关联表p，c_id关联到表c。
         * 对于这种情况需要将查询c表的操作转换为查询d表的操作，在查询d表时按照p_id=cascadeParentValue过滤d表数据
         * 同时以c_id字段查询过滤c表数据。这种情况需要前端再做一次数据过滤。目前程序暂时不实现这个逻辑。
         */
        console.log('getQueryParams',control);
        if(control.cascade){
            //情况1
            if(control.cascade.type===CASCADE_TYPE.MANY2ONE){
                if(control.cascade.relatedField){
                    if(cascadeParentValue){
                        const filter={[control.cascade.relatedField]:cascadeParentValue}
                        return {
                            modelID:field.relatedModelID,
                            fields:control.fields,
                            filter:filter,
                            pagination:{current:1,pageSize:500}
                        }        
                    }
                } else {
                    console.error('do not provide related field.');    
                }
            } /*else if(control.cascade.type===CASCADE_TYPE.MANY2MANY){
                
            }*/else {
                console.error('not supported cascade type:',control.cascade.type);
            }
            return undefined;
        }
        
        return {
            modelID:field.relatedModelID,
            fields:control.fields,
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

    console.log('field:',field);
    const dataSource=options.map(item=>({
        key:item.id,
        title:item.name?item.name:item.id,
        description: item.name?item.name+'('+item.id+')':item.id,
        chosen:true
    }));

    const filterOption = (inputValue, option) => option.description.indexOf(inputValue) > -1;

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
                list:list
            },
            modified:{
                modelID:field.relatedModelID,
                fieldType:field.fieldType,
                list:targetKeys
            }
        }));

        if(valueError){
            dispatch(removeErrorField(field.field));
        }
    };

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
        </Tooltip>):transferControl
    //获取文本输入框的标签，如果form控件配置了label属性则直接使用，
    //如果控件没有配置label属性，则取字段配置的字段name
    const label=control.label?control.label:(field?field.name:"");
    
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