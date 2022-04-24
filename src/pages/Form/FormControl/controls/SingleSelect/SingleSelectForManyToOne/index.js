import {useCallback, useState} from 'react';
import { createSelector } from '@reduxjs/toolkit';
import {Select,Space,Tooltip } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { modiData,removeErrorField } from '../../../../../../redux/dataSlice';
import {FRAME_MESSAGE_TYPE,CASCADE_TYPE} from '../../../../../../utils/constant';
import './index.css';

const { Option } = Select;

export default function SingleSelectForManyToOne({control,field,sendMessageToParent}){
    const dispatch=useDispatch();
    const {origin,item:frameItem}=useSelector(state=>state.frame);
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectValueError=(state,field)=>state.data.errorField[field];
    const selectCascadeParentValue=(state,field,cascade)=>{
        console.log('selectCascadeParentValue',field,cascade);
        if(cascade&&cascade.parentField){
            if(state.data.modified[cascade.parentField]){
                return state.data.modified[cascade.parentField];
            } else {
                return state.data.origin[cascade.parentField];
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
    
    const [options,setOptions]=useState([]);
    
    //console.log('originValue',field.field,originValue,cascadeParentValue);

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

    const getQueryParams=(field,control,value)=>{
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
                    const filter=getFilter(control,value)
                    const filterbyParent={[control.cascade.relatedField]:cascadeParentValue}
                    const op='Op.and';
                    const mergedFilter={[op]:[filterbyParent,filter]};
                    console.log('mergedFilter:',mergedFilter);
                    return {
                        modelID:field.relatedModelID,
                        fields:control.fields,
                        filter:mergedFilter,
                        pagination:{current:1,pageSize:500}
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
            filter:getFilter(control,value),
            pagination:{current:1,pageSize:500}
        }
    }

    const onSearch=(value)=>{
        //根据不同的情况获取不同查询条件
        const queryParams=getQueryParams(field,control,value);
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
    };

    /*useEffect(()=>{
        onSearch("");
    },[onSearch]);*/

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

    const onFocus=()=>{
        onSearch("");
    }

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
        onFocus={onFocus}
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