import { configureStore } from '@reduxjs/toolkit'

import frameReducer from './frameSlice';
import definitionReducer from './definitionSlice';
import dataReducer from './dataSlice';

export default configureStore({
  reducer: {
    frame:frameReducer,
    definition:definitionReducer,
    data:dataReducer
  }
});