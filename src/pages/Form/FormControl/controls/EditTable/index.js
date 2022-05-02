import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { Space } from 'antd';

import Header from './Header';
import Body from './Body';
import { modiData,removeErrorField } from '../../../../../redux/dataSlice';
import {
    FRAME_MESSAGE_TYPE,
    CC_COLUMNS,
    SAVE_TYPE,
    CASCADE_TYPE
} from '../../../../../utils/constant';

import './index.css';
import { useCallback } from 'react';

export default function EditTable({control,field,sendMessageToParent}){
    const dispatch=useDispatch();
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectModificationValue=(state,field)=>state.data.modification[field];
    const selectValueError=(state,field)=>state.data.errorField[field];
    const selectCascadeValue=(state,field,cascade)=>{
        console.log('selectCascadeParentValue',field,cascade);
        if(cascade&&cascade.parentField){
            if(state.data.modified[cascade.parentField]){
                const modifiedValue=state.data.modified[cascade.parentField];
                return modifiedValue.value?modifiedValue.value:modifiedValue;
            }
        }
        return undefined;
    }

    const selectValue=createSelector(
        selectOriginValue,
        selectModifiedValue,
        selectModificationValue,
        selectCascadeValue,
        selectValueError,
        (originValue,modifiedValue,modificationValue,cascadeValue,valueError)=>{
            return {originValue,modifiedValue,modificationValue,cascadeValue,valueError}
        }
    );
    const {originValue,modifiedValue,modificationValue,cascadeValue,valueError}=useSelector(state=>selectValue(state.data,field.field,control.cascade));
    
    console.log('cascadeValue',cascadeValue);

    const saveTableData=useCallback((modificationList,modifiedList)=>{
        dispatch(modiData({
            field:field.field,
            modification:{
                modelID:field.relatedModelID,
                fieldType:field.fieldType,
                relatedField:field.relatedField,
                list:modificationList
            },
            modified:{
                list:modifiedList
            }
        }));

        if(valueError){
            dispatch(removeErrorField(field.field));
        }
    },[field,valueError,dispatch]);

    const onAddNewRow=useCallback(()=>{
        console.log('onAddNewRow');
        const newRow={};
        newRow[CC_COLUMNS.CC_SAVE_TYPE]=SAVE_TYPE.CREATE;
        
        const modificationList=(modificationValue&&modificationValue.list)?[...(modificationValue.list)]:[];
        modificationList.push(newRow);
        console.log('modificationList',modificationList);

        const modifiedList = (modifiedValue&&modifiedValue.list)?[...(modifiedValue.list)]:[];
        modifiedList.push(newRow);
        console.log('modifiedList',modifiedList);
        saveTableData(modificationList,modifiedList);
    },[modifiedValue,modificationValue,saveTableData]);

    const onDeleteRow=useCallback((rowNo)=>{
        //取出已经删除的数据
        let modificationList=(modificationValue&&modificationValue.list)?[...(modificationValue.list)]:[];
        const deleteList=modificationList.filter(item=>item[CC_COLUMNS.CC_SAVE_TYPE]===SAVE_TYPE.DELETE);
        console.log('deletelist',deleteList);
        //删除指定位置记录
        const modifiedList = [...(modifiedValue.list)];
        const deleteRow=modifiedList.splice(rowNo,1)[0];
        console.log('deleteRow',deleteRow);
        //根据结果生成修改记录
        modificationList=modifiedList.filter(item=>item[CC_COLUMNS.CC_SAVE_TYPE]!==undefined);
        modificationList=modificationList.concat(deleteList);
        console.log('modificationList',modificationList);
        //如果删除的数组项不是新增项目择加入删除项目
        if(deleteRow[CC_COLUMNS.CC_SAVE_TYPE]!==SAVE_TYPE.CREATE){
            console.log('deleteRow.savetype',deleteRow[CC_COLUMNS.CC_SAVE_TYPE],SAVE_TYPE.CREATE);
            modificationList.push({id:deleteRow[CC_COLUMNS.CC_ID],[CC_COLUMNS.CC_SAVE_TYPE]:SAVE_TYPE.DELETE});
        }

        saveTableData(modificationList,modifiedList);
    },[modifiedValue,modificationValue,saveTableData]);

    const onEditCell=useCallback((rowNo,field,value)=>{
        //取出已经删除的数据
        let modificationList=(modificationValue&&modificationValue.list)?[...(modificationValue.list)]:[];
        const deleteList=modificationList.filter(item=>item[CC_COLUMNS.CC_SAVE_TYPE]===SAVE_TYPE.DELETE);
        console.log('deletelist',deleteList);
        //删除指定位置记录
        const modifiedList = [...(modifiedValue.list)];
        console.log('modifiedList1',modifiedList);
        if(modifiedList[rowNo][CC_COLUMNS.CC_SAVE_TYPE]===undefined){
            modifiedList[rowNo]={...(modifiedList[rowNo]),[field]:value,[CC_COLUMNS.CC_SAVE_TYPE]:SAVE_TYPE.UPDATE};
        } else {
            modifiedList[rowNo]={...(modifiedList[rowNo]),[field]:value};
        }
        console.log('modifiedList2',modifiedList);
        //根据结果生成修改记录
        modificationList=modifiedList.filter(item=>item[CC_COLUMNS.CC_SAVE_TYPE]!==undefined);
        modificationList=modificationList.concat(deleteList);
        console.log('modificationList',modificationList);

        saveTableData(modificationList,modifiedList);
    },[modifiedValue,modificationValue,saveTableData]);

    const label=control.label?control.label:(field?field.name:"");
    const data=modifiedValue?modifiedValue:originValue;
    return (
        <div className='control-edittable'>
            <Space size={2} direction="vertical" style={{width:'100%'}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.required?(<span style={{color:'red'}}>*</span>):null}
                    {label}
                </div>
                <div className='control-edittable'>
                    <div className='control-edittable-header-wrapper'>
                        <Header control={control} onAddNewRow={onAddNewRow}/>
                    </div>
                    <div className='control-edittable-body-wrapper'>
                        <Body 
                            sendMessageToParent={sendMessageToParent} 
                            control={control} 
                            data={data} 
                            cascadeValue={cascadeValue}
                            onDeleteRow={onDeleteRow} 
                            onEditCell={onEditCell}/>
                    </div>
                </div>
            </Space>
        </div>
    );
}