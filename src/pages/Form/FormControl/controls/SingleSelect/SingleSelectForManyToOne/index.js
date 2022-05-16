import {useState} from 'react';
import { createSelector } from '@reduxjs/toolkit';
import {Select,Space,Tooltip } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { modiData,removeErrorField } from '../../../../../../redux/dataSlice';
import {FRAME_MESSAGE_TYPE,CASCADE_TYPE} from '../../../../../../utils/constant';
import './index.css';

const { Option } = Select;

export default function SingleSelectForManyToOne({dataPath,control,field,sendMessageToParent,cascadeValue}){
    const dispatch=useDispatch();
    const {origin,item:frameItem}=useSelector(state=>state.frame);
    
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
            let pathDeep=dataPath.length;
            if(cascade.parentPath){
                const pathArr=cascade.parentPath.split('/');
                for(let i=0;i<pathArr.length;++i){
                    if(pathArr[i]==='..'){
                        /**
                         *dataPaht的形式类似[rowKey,fieldid,list,rowkey,fieldid,list,rowKey,fieldid,list, ...] 
                         *当前字段节点的path一定是一个rowKey节点，往上一层需要自动跳转到上一个rowKey节点
                         *两个rowKey间的间隔是3，因此遇到一个..，则路径深度减3
                         */
                        pathDeep-=3;
                    } else {
                        break;
                    }
                }
            }
            
            let updatedNode=data.updated;
            for(let i=0;i<pathDeep;++i){
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
        selectUpdatedValue,
        selectValueError,
        selectCascadeParentValue,
        (updatedValue,valueError,cascadeParentValue)=>{
            return {updatedValue,valueError,cascadeParentValue};
        }
    );
    
    const {updatedValue,valueError,cascadeParentValue}=useSelector(state=>selectValue(state.data,dataPath,field.field,control.cascade));

    const [options,setOptions]=useState([]);
    
    const onChange=(value)=>{
        if(value===undefined){
            value=null;
        }

        const updated=(value===null)?{
                value:null,
                list:[],
                total:0,
                modelID:field.relatedModelID
            }:{
                value:value,
                list:[options.find(item=>item.id===value)],
                total:1,
                modelID:field.relatedModelID
            }

        dispatch(modiData({
            dataPath:dataPath,
            field:field.field,
            updated:updated,
            update:value}));
        
        if(valueError){
            const errFieldPath=dataPath.join('.')+'.'+field.field;
            dispatch(removeErrorField(errFieldPath));
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
        if(updatedValue&&item.id===updatedValue.value){
            hasOriginValue=true;
        }
        return (<Option key={item.id} value={item.id}>{item[optionLabel]}</Option>);
    }):[];

    if(hasOriginValue===false&&updatedValue&&updatedValue.list&&updatedValue.list.length>0){
        const item=updatedValue.list[0];
        optionControls.push(<Option key={'origin'} value={item.id}>{item[optionLabel]}</Option>);
    }

    let selectControl= (<Select
        style={{width:'100%'}}  
        placeholder={control.placeholder?control.placeholder:""} 
        value={updatedValue?updatedValue.value:updatedValue} 
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
    
    if(control.inline){
        return selectControl;
    }
    
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