import {Select} from 'antd';

import './index.css';

const { Option } = Select;

export default function SingleSelectForOptions({field,row,rowNo,onEditCell,disabled}){
    const onChange=(value)=>{
        if(value===undefined){
            //这里主要是考虑值被删除的时候，将值置为空，
            //否则删除后由于modifiedValue为undefind，将显示originValue，无法实现删除值的逻辑
            value=null;
        }
        onEditCell(rowNo,field.field,value);
    }

    const options=field.options.map((item,index)=>
    (<Option key={index} value={item.value}>{item.label}</Option>));
    
    return (<Select  
        className='edittable-cell-singleselect'
        placeholder={field.placeholder?field.placeholder:""} 
        value={row[field.field]} 
        allowClear
        disabled={disabled||field.disabled} 
        onChange={onChange}
        size='small'
        >
        {options}
    </Select>);
}