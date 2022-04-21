import {FIELD_TYPE} from  '../../utils/constant';

const validateField=(item,values)=>{
    if(item.required){
        if(values[item.field]){
            if(values[item.field].fieldType){
                if(values[item.field].fieldType===FIELD_TYPE.MANY2MANY||
                    values[item.field].fieldType===FIELD_TYPE.ONE2MANY||
                    values[item.field].fieldType===FIELD_TYPE.MANY2ONE||
                    values[item.field].fieldType===FIELD_TYPE.FILE){
                    if(!(values[item.field].list&&values[item.field].list.length>0)){
                        return {message:'必填字段！'};    
                    }
                }   
            } else {
                if(values[item.field].length<=0){
                    return {message:'必填字段！'};
                }
            }
        } else {
            return {message:'必填字段！'};
        }
    }
    return false;
}

export {
    validateField
}