import { useEffect, useState } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import {Space,Transfer,Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { modiData,removeErrorField } from '../../../../../redux/dataSlice';
import {
    FRAME_MESSAGE_TYPE,
    CC_COLUMNS,
    SAVE_TYPE
} from '../../../../../utils/constant';
import './index.css';

export default function TransferControl({control,field,sendMessageToParent}){
    const {origin,item:frameItem}=useSelector(state=>state.frame);
    const [optionsLoaded,setOptionsLoaded]=useState(false);
    const [options,setOptions]=useState([]);
    const dispatch=useDispatch();
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectValueError=(state,field)=>state.data.errorField[field];
    const selectValue=createSelector(selectOriginValue,selectModifiedValue,selectValueError,(originValue,modifiedValue,valueError)=>{
        return {originValue,modifiedValue,valueError}
    })
    const {originValue,modifiedValue,valueError}=useSelector(state=>selectValue(state.data,field.field));
    const [targetKeys,setTargetKeys]=useState(originValue?originValue.list.map(item=>item.id):[]);

    useEffect(()=>{
        if(control.disabled!==true&&optionsLoaded===false){
            const queryResponse=(event)=>{
                const {type,dataKey,data}=event.data;
                if(type===FRAME_MESSAGE_TYPE.QUERY_RESPONSE&&
                    dataKey===field.field){
                    console.log('queryResponse',data);
                    setOptions(data.list);
                    setOptionsLoaded(true);
                }
            }

            const getRelatedFields=(control)=>{
                return control.fields;
            }

            const loadOptions=()=>{
                const frameParams={
                    frameType:frameItem.frameType,
                    frameID:frameItem.params.key,
                    dataKey:field.field,
                    origin:origin
                };
                const queryParams={
                    modelID:field.relatedModelID,
                    fields:getRelatedFields(control),
                    pagination:{current:1,pageSize:1000}
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
            window.addEventListener("message",queryResponse);
            loadOptions();
            return ()=>{
                window.removeEventListener("message",queryResponse);
            }
        }
    },[optionsLoaded,field,control,origin,frameItem,sendMessageToParent]);
    
    console.log('field:',field);
    const dataSource=options.map(item=>({
        key:item.id,
        title:item.id,
        description: item.id,
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