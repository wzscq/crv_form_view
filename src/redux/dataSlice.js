import { createSlice } from '@reduxjs/toolkit';

// Define the initial state using that type
const initialState = {
    loaded:false,
    data:{
        origin:{
           
        },
        modification:{

        },
        modified:{

        },
        errorField:{

        }
    },
}

export const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setData:(state,action) => {
            const {list}=action.payload;
            if(list.length>0){
                state.data.origin=list[0];
                console.log("setData",state.data.origin)
            }
            state.loaded=true;
        },
        modiData:(state,action) => {
            const {field,modified,modification}=action.payload;
            state.data.modified[field]=modified;
            state.data.modification[field]=modification;
        },
        setErrorField:(state,action) => {
            state.data.errorField=action.payload;
        },
        removeErrorField:(state,action) => {
            delete state.data.errorField[action.payload];
        },
        refreshData:(state,action) => {
            state.loaded=false;
        },
    }
});

// Action creators are generated for each case reducer function
export const { 
    setData,
    modiData,
    setErrorField,
    removeErrorField,
    refreshData
} = dataSlice.actions

export default dataSlice.reducer