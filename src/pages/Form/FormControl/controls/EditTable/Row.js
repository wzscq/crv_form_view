import DeleteRowButton from "./DeleteRowButton";
import TableCell from "./TableCell";

export default function Row({control,row,rowNo,onDeleteRow,onEditCell,cascadeValue,sendMessageToParent}){

    let gridTemplateColumns='';
    const columns=control.fields
        .filter(item=>item.visible)
        .map((field,index)=>{
        gridTemplateColumns+=(field.width?(field.width+'px '):'auto ');
        return (
            <TableCell 
                field={field} 
                row={row} 
                disabled={control.disabled}
                colNo={index}
                rowNo={rowNo} 
                cascadeValue={cascadeValue}
                onEditCell={onEditCell}
                sendMessageToParent={sendMessageToParent}  />
        );
    });

    gridTemplateColumns+=' 30px';
    columns.push(<DeleteRowButton disabled={control.disabled} rowNo={rowNo} colNo={columns.length} onDeleteRow={onDeleteRow}/>);

    return (
        <div style={{display:'grid',gridTemplateColumns:gridTemplateColumns,gridAutoRows:'minmax(20px, auto)'}}>
            {columns}
        </div>
    );
}