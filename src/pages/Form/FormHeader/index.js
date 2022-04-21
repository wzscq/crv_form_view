import { Button,Space } from "antd"
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import {
    FRAME_MESSAGE_TYPE,
    FORM_TYPE,
    CC_COLUMNS,
    SAVE_TYPE} from '../../../utils/constant';
import {setErrorField} from '../../../redux/dataSlice';
import {validateField} from '../valueValidate';

import './index.css';

export default function FormHeader({label,operations,form,sendMessageToParent}){
    const dispatch=useDispatch();
    const {modified,origin,modification}=useSelector(state=>state.data.data);
    const {modelID,formType}=useParams();
    console.log('modified',modified,modification);
    const getOperationData=useCallback((modification)=>{
        const saveType={};
        if(formType===FORM_TYPE.CREATE){
            saveType[CC_COLUMNS.CC_SAVE_TYPE]=SAVE_TYPE.CREATE;
            return {
                modelid:modelID,
                list:[{...modification,...saveType}]
            };
        } else if(formType===FORM_TYPE.EDIT){
            saveType[CC_COLUMNS.CC_SAVE_TYPE]=SAVE_TYPE.UPDATE;
            return {
                modelid:modelID,
                list:[{
                    ...modification,
                    ...saveType,
                    id:origin.id,
                    version:origin.version}]
            };
        }
        return {}
    },[formType,modelID,origin]);

    const validateData=useCallback((modified)=>{
        console.log('validateData');
        let valid=true;
        const errorField={}
        let values=modified;
        if(formType===FORM_TYPE.EDIT){
            values={...origin,...modified};
        }
        form.controls.forEach((item) => {   
            const err=validateField(item,values);
            if(err){
                errorField[item.field]=err
                valid=false;
            }
        });
        if(!valid){
            dispatch(setErrorField(errorField));
        }
        console.log('validateData',valid,errorField);
        return valid;
    },[form,formType,origin,dispatch]);

    const doOperation=(operation,modification,modified)=>{
        if(operation){
            if(operation.validateFormData!==false){
                //验证表单数据合法性
                if(!validateData(modified)){
                    console.log('存在错误');
                    return;
                }
            }
            const operationData=getOperationData(modification);
            const message={
                type:FRAME_MESSAGE_TYPE.DO_OPERATION,
                data:{
                    operationItem:{
                        ...operation,
                        input:operationData
                    }
                }
            };
            sendMessageToParent(message);
        }
    }

    return (
        <>
            <div className="form-header-label">{label}</div>
            <div className="form-header-operationbar">
                <Space>
                    {
                        operations.map(element=>{
                            return (<Button type="primary" onClick={()=>doOperation(element,modification,modified)}>{element.name}</Button>);
                        })
                    }
                </Space>
            </div>
        </>
    )
}