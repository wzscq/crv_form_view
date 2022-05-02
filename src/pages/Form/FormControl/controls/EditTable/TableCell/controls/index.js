import Text from './Text';
import SingleSelect from './SingleSelect';
/**
 * 以下为控件类型枚举常量定义
 */
 export const CONTROL_TYPE={
    TEXT:"Text",   //文本录入框
    SINGLESELECT:'SingleSelect',  //单选下拉框
}

/**
 * 以下为控件注册表
 */
export const controlRegister={
    [CONTROL_TYPE.TEXT]:Text,
    [CONTROL_TYPE.SINGLESELECT]:SingleSelect,
}

export const getControl=(props)=>{

    const Component=controlRegister[props.field.controlType];
    if(Component){
        return <Component {...props}/>;
    }
    return (<div>{"unkown control:"+props.field.controlType}</div>);
}