import {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { Space,Button,Upload,Tooltip } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import { modiData,removeErrorField } from '../../../../../redux/dataSlice';
import {
    CC_COLUMNS,
    SAVE_TYPE
} from '../../../../../utils/constant';
import {createDownloadFileMessage} from '../../../../../utils/normalOperations';

import './index.css';

export default function FileControl({control,field,sendMessageToParent}){
    const dispatch=useDispatch();
    const selectOriginValue=(state,field)=>state.data.origin[field];
    const selectModifiedValue=(state,field)=>state.data.modified[field];
    const selectValueError=(state,field)=>state.data.errorField[field];
    const selectValue=createSelector(selectOriginValue,selectModifiedValue,selectValueError,(originValue,modifiedValue,valueError)=>{
        return {originValue,modifiedValue,valueError}
    });
    
    const {originValue,modifiedValue,valueError}=useSelector(state=>selectValue(state.data,field.field));
    let initFileList=[];
    if(originValue){
        initFileList=originValue.list.map(item=>
        {
            return {
                ...item,
                uid:item.id,
                status: 'done',
            }
        });
    }
    const [fileList,setFileList]=useState(initFileList);

    const className=valueError?'control-singlefile control-singlefile-error':'control-singlefile control-singlefile-normal';
    
    //获取文本输入框的标签，如果form控件配置了label属性则直接使用，
    //如果控件没有配置label属性，则取字段配置的字段name
    const label=control.label?control.label:(field?field.name:"");

    useEffect(()=>{
        const data=fileList;
        const saveType={};
        saveType[CC_COLUMNS.CC_SAVE_TYPE]=SAVE_TYPE.CREATE;
        const addList=data.map(selectedFile=>{
            const originItem=originValue?originValue.list.find(item=>item.id===selectedFile.uid):null;
            if(originItem){
                return {id:originItem.id};
            } else {
                return {
                    id:selectedFile.uid,
                    name:selectedFile.name,
                    contentBase64:selectedFile.contentBase64,
                    ...saveType
                };
            }
        });

        saveType[CC_COLUMNS.CC_SAVE_TYPE]=SAVE_TYPE.DELETE;
        const delList=originValue?originValue.list.map(item=>{
            const newItem=addList.find(element=>element.id===item.id);
            if(newItem){
                return {id:item.id};
            } else {
                return {...item,...saveType};
            }
        }):[];

        const list = addList.concat(delList).filter(item=>item[CC_COLUMNS.CC_SAVE_TYPE]);
        dispatch(modiData({
            field:field.field,
            modification:{
                fieldType:field.fieldType,
                list:list
            },
            modified:{
                fieldType:field.fieldType,
                list:data
            }
        }));
    },[fileList,dispatch,field,originValue]);

    const props = {
        accept:control.accept,
        showUploadList:{
            showDownloadIcon:true,
            showRemoveIcon:control.disabled!==true,
        },
        onDownload:file =>{
            sendMessageToParent(createDownloadFileMessage({list:[file]},file.name));
        },
        onRemove: file => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: file => {
            const reader = new FileReader();
            reader.onload=(e)=>{
                const fileTmp={uid:file.uid,name:file.name,contentBase64:e.target.result};
                setFileList([...fileList,fileTmp]);
                if(valueError){
                    dispatch(removeErrorField(field.field));
                }
            };
            reader.readAsDataURL(file);
            return false;
        },
        fileList,
    };

    let fileControl=(
        <Upload {...props}>
            {(fileList.length<control.maxCount)?(<Button danger={valueError?true:false} disabled={control.disabled} icon={<UploadOutlined />}>选择文件</Button>):null}
        </Upload>
    );

    fileControl=valueError?(
        <Tooltip title={valueError.message}>
            {fileControl}
        </Tooltip>):fileControl;
    
    return (
        <div className={className}>
            <Space size={2} direction="vertical" style={{}}>
                <div style={{width:'100%',textAlign:'left'}}>
                    {control.required?(<span style={{color:'red'}}>*</span>):null}
                    {label}
                </div>
                {fileControl} 
            </Space>
        </div>
    )
}