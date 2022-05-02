import { Input } from "antd";

export default function Text({field,row,rowNo,disabled,onEditCell}){
    
    const onChange=(e)=>{
        console.log(e.target.value);
        onEditCell(rowNo,field.field,e.target.value);
    }
    
    return (
        <Input  
            placeholder={field.placeholder?field.placeholder:""} 
            value={row[field.field]} 
            allowClear
            disabled={disabled||field.disabled} 
            onChange={onChange}
            size='small'
        />
    );
}