import Row from "./Row";

export default function Body({control,data,onDeleteRow,onEditCell,cascadeValue,sendMessageToParent}){
    const rows=(data&&data.list)?data.list.map((row,index)=>{
        return (
            <Row 
                key={index} 
                control={control} 
                row={row} 
                rowNo={index} 
                onDeleteRow={onDeleteRow}
                onEditCell={onEditCell}
                cascadeValue={cascadeValue}
                sendMessageToParent={sendMessageToParent}
            />
        );
    }):null;
    
    return (
        <>
            {rows}
        </>
    );
}