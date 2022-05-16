import DeleteRowButton from "./DeleteRowButton";
import TableCell from "./TableCell";

export default function Row({dataPath,control,rowKey,onDeleteRow,sendMessageToParent}){

    let gridTemplateColumns='';
    const columns=control.controls
        .filter(item=>item.visible)
        .map((field,index)=>{
        gridTemplateColumns+=(field.width?(field.width+'px '):'auto ');
        return (
            <TableCell 
                colNo={index}
                key={field.field}               
                dataPath={dataPath}
                field={field} 
                disabled={control.disabled}
                sendMessageToParent={sendMessageToParent}  />
        );
    });

    gridTemplateColumns+=' 30px';
    columns.push(<DeleteRowButton 
        disabled={control.disabled} 
        colNo={columns.length}
        rowKey={rowKey} 
        onDeleteRow={onDeleteRow}/>);

    return (
        <div style={{display:'grid',gridTemplateColumns:gridTemplateColumns,gridAutoRows:'minmax(20px, auto)'}}>
            {columns}
        </div>
    );
}