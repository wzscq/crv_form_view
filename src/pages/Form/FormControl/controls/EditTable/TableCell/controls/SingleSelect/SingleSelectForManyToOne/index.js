import {useState} from 'react';
import {Select} from 'antd';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    FRAME_MESSAGE_TYPE,
    CASCADE_TYPE} from '../../../../../../../../../utils/constant';
import './index.css';

const { Option } = Select;

export default function SingleSelectForManyToOne({field,cascadeValue,row,rowNo,colNo,disabled,onEditCell,sendMessageToParent}){
    const {origin,item:frameItem}=useSelector(state=>state.frame);
    const [options,setOptions]=useState([]);
    
    const onChange=(value)=>{
        if(value===undefined){
            //这里主要是考虑值被删除的时候，将值置为空，
            //否则删除后由于modifiedValue为undefind，将显示originValue，无法实现删除值的逻辑
            value=null;
        }
        onEditCell(rowNo,field.field,value);
    }

    const getFilter=(field,value)=>{
        const fieldsFilter=field.fields.map(element => {
            const tempFieldFilter={};
            tempFieldFilter[element.field]='%'+value+'%';
            return tempFieldFilter;
        });
        const op='Op.or';
        return {[op]:fieldsFilter};
    };

    const getQueryParams=(field,value)=>{
        if(field.parentCascade){
            if(field.parentCascade.type===CASCADE_TYPE.MANY2ONE){
                if(field.parentCascade.relatedField){
                    if(cascadeValue){
                        const filter=getFilter(field,value);
                        const filterbyParent={[field.parentCascade.relatedField]:cascadeValue}
                        const op='Op.and';
                        const mergedFilter={[op]:[filterbyParent,filter]};
                        console.log('mergedFilter:',mergedFilter);
                        return {
                            modelID:field.relatedModelID,
                            fields:field.fields,
                            filter:mergedFilter,
                            pagination:{current:1,pageSize:500}
                        }   
                    }     
                } else {
                    console.error('do not provide related field.');    
                }
            } /*else if(control.cascade.type===CASCADE_TYPE.MANY2MANY){
                
            }*/else {
                console.error('not supported cascade type:',field.parentCascade.type);
            }
            return undefined;
        }

        return {
            modelID:field.relatedModelID,
            fields:field.fields,
            filter:getFilter(field,value),
            pagination:{current:1,pageSize:500}
        }
    }

    const onSearch=(value)=>{
        //根据不同的情况获取不同查询条件
        const queryParams=getQueryParams(field,value);
        if(queryParams){
            const frameParams={
                frameType:frameItem.frameType,
                frameID:frameItem.params.key,
                dataKey:field.field+'_'+colNo+'_'+rowNo,
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

    useEffect(()=>{
        const queryResponse=(event)=>{
            const {type,dataKey,data}=event.data;
            if(type===FRAME_MESSAGE_TYPE.QUERY_RESPONSE&&
                dataKey===field.field+'_'+colNo+'_'+rowNo){
                console.log('queryResponse',data);
                setOptions(data.list);
            }
        }
        window.addEventListener("message",queryResponse);
        return ()=>{
            window.removeEventListener("message",queryResponse);
        }
    },[setOptions,field,colNo,rowNo]);

    const onFocus=()=>{
        onSearch("");
    }

    const optionLabel=field.optionLabel?field.optionLabel:'id';
    
    const originValue=row[field.field];
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

    return (<Select  
        className='edittable-cell-singleselect-many2one'
        placeholder={field.placeholder?field.placeholder:""} 
        value={(originValue&&originValue.value)?originValue.value:originValue} 
        allowClear
        showSearch
        size='small'
        disabled={disabled||field.disabled} 
        onSearch={onSearch}
        onChange={onChange}
        onFocus={onFocus}
        filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0||
            option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }       
        >
        {optionControls}
    </Select>);
}