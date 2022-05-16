import { Button,Space } from "antd"
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import {
    FRAME_MESSAGE_TYPE,
    FORM_TYPE,
    CC_COLUMNS
} from '../../../utils/constant';
import {setErrorField} from '../../../redux/dataSlice';
import {valueValidate} from '../valueValidate';

import './index.css';

export default function FormHeader({label,operations,form,sendMessageToParent}){
    const dispatch=useDispatch();
    const {updated,origin,update}=useSelector(state=>{
        return state.data
    });
    const {modelID,formType}=useParams();
    
    const getUpdateRequestData=(controls,data)=>{
        const list=[];
        for(const rowKey in data){
            const rowData={...data[rowKey]};
            list.push(rowData);
            for(const controlIdx in controls){
                let {controls:subControls,field,relatedModelID,fieldType,associationModelID,relatedField}=controls[controlIdx];
                if(subControls){
                    if(rowData[field]&&rowData[field].list){
                        const fieldList=rowData[field].list;
                        rowData[field]={
                            ...rowData[field],
                            modelID:relatedModelID,
                            fieldType:fieldType,
                            associationModelID:associationModelID,
                            relatedField:relatedField,
                            list:{}};
                        rowData[field].list=getUpdateRequestData(subControls,fieldList);
                    }
                }
            }
        }
        return list;
    }

    const getDetailRequestData=(data)=>{
        const list=[];
        for(const rowKey in data){
            const rowData=data[rowKey];
            list.push({[
                [CC_COLUMNS.CC_ID]]:rowData[CC_COLUMNS.CC_ID],
                [CC_COLUMNS.CC_VERSION]:rowData[CC_COLUMNS.CC_VERSION]
            });
        }
        return list;
    }

    const getOperationData=(update)=>{
        if(formType===FORM_TYPE.CREATE||
           formType===FORM_TYPE.EDIT
        ){
            const list=getUpdateRequestData(form.controls,update);
            return {
                modelid:modelID,
                list:list
            };
        } else if(formType===FORM_TYPE.DETAIL){
            const list=getDetailRequestData(origin);
            return {
                modelid:modelID,
                list:list
            };
        }
        return {}
    };

    const validateData=(updated)=>{
        let errorField={errorField:{}};
        valueValidate(form.controls,updated,errorField);  
        errorField=errorField.errorField;
        const errFieldCount=Object.keys(errorField).length;
        if(errFieldCount>0){
            dispatch(setErrorField(errorField));
        }
        return (errFieldCount<=0);
    };

    const doOperation=(operation,update,updated)=>{
        if(operation){
            if(operation.validateFormData!==false){
                //验证表单数据合法性
                if(!validateData(updated)){
                    console.warn('验证表单数据合法性,存在错误!');
                    return;
                }
            }
            const operationData=getOperationData(update);
            const message={
                type:FRAME_MESSAGE_TYPE.DO_OPERATION,
                data:{
                    operationItem:{
                        ...operation,
                        input:{...operation.input,...operationData}
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
                            return (<Button type="primary" onClick={()=>doOperation(element,update,updated)}>{element.name}</Button>);
                        })
                    }
                </Space>
            </div>
        </>
    )
}