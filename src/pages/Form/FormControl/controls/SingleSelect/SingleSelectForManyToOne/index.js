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
    
    const [options,setOptions]=useState([]);
    
    console.log('modifiedValue',field.field,modifiedValue);

    const onChange=(value)=>{
        
        const modified=(value===undefined)?{
                value:null,
                list:[],
                total:0,
                modelID:modifiedValue.modelID
            }:{
                value:value,
                list:[options.find(item=>item.id===value)],
                total:1,
                modelID:modifiedValue.modelID
            }
        dispatch(modiData({field:field.field,modified:modified,modification:value}));
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
         * 
         * 级联关系字段存在以下4种情况（目前程序仅实现前2个情况），
         * 情况1：
         *      级联关系中父字段（如p_id）是多对一关联字段，对应了关联表p，
         *      子字段可以是多对一或者多对多字段，对应了关联表c,
         *      同时在子字段对应的关联表c中也存在多对一关联字段(如 c_p_id)，对应关联表p。
         *      这种情况，在查询子字段对应的关联表c的数据时，需要在查询条件中补充c_p_id=cascadeParentValue作为查询的先决条件。
         * 
         * 情况2：
         *      这种情况可以认为是情况1的扩展，父级字段同情况1
         *      子字段是一个一对多虚拟字段，关联到作为主从表中的明细表d，
         *      同时在明细表d中有一个多对一字段，对应关联表c
         *      关联表c中也存在多对一关联字段(如 c_p_id)，对应关联表p。
         *      这种情况，可以认为是情况一中子字段为多对多的特殊形式（多对多中间表为自定义表的情况，比简单的多对多增加一些属性）
         *      这种情况使用明细表控件，级联关系配置在一对多字段上，明细表下级字段可以使用父级级联字段的值实现过滤。
         * 
         * 情况3：表c和表p存在多对多关联关系。对于这种情况，需要将查询c表的操作转换为查询p表的操作，
         * 同时在查询p表操作时将关联到c表的多对多字段中补充对c对应字段的查询。
         *
         * 情况4：有另外一个表d，表d中存在两个多对一关联字段p_id和c_id，其中p_id关联表p，c_id关联到表c。
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
        if(modifiedValue&&item.id===modifiedValue.value){
            hasOriginValue=true;
        }
        return (<Option key={item.id} value={item.id}>{item[optionLabel]}</Option>);
    }):[];

    if(hasOriginValue===false&&modifiedValue&&modifiedValue.list&&modifiedValue.list.length>0){
        const item=modifiedValue.list[0];
        optionControls.push(<Option key={'origin'} value={item.id}>{item[optionLabel]}</Option>);
    }

    let selectControl= (<Select  
        placeholder={control.placeholder?control.placeholder:""} 
        value={modifiedValue!==undefined?modifiedValue.value:undefined} 
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