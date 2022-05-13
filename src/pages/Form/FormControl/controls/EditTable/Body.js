import Row from "./Row";

export default function Body({dataPath,control,data,onDeleteRow,sendMessageToParent}){
    const rows=(data&&data.list)?Object.keys(data.list).map((rowKey,index)=>{
        return (
            <Row 
                dataPath={[...dataPath,rowKey]}
                key={rowKey} 
                rowKey={rowKey}
                control={control} 
                onDeleteRow={onDeleteRow}
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