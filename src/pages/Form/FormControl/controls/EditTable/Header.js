import AddRowButton from "./AddRowButton";

export default function Header({control,onAddNewRow}){
    let gridTemplateColumns='';
    const columns=control.fields
        .filter(item=>item.visible)
        .map((field,index)=>{
        gridTemplateColumns+=(field.width?(field.width+'px '):'auto ');
        console.log(field,gridTemplateColumns);
        const wrapperStyle={
            gridColumnStart:index+1,
            gridColumnEnd:index+2,
            gridRowStart:1,
            gridRowEnd:2,
            backgroundColor:"#FFFFFF",
            borderBottom:'1px solid #d9d9d9',
            borderLeft:'1px solid #d9d9d9',
            padding:2}

        return (
            <div style={wrapperStyle}>{field.label}</div>
        );
    });

    gridTemplateColumns+=' 30px';
    columns.push(<AddRowButton disabled={control.disabled} colNo={columns.length} onAddNewRow={onAddNewRow}/>);

    return (
        <div style={{display:'grid',gridTemplateColumns:gridTemplateColumns,gridAutoRows:'minmax(20px, auto)'}}>
            {columns}
        </div>
    );
}