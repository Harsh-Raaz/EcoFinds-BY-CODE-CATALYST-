import { configureStore } from "@reduxjs/toolkit";
import ecofindReducer from "./ecofindslice.js"
const store = configureStore({
    reducer:{
        ecofind:ecofindReducer,
    },
})
export default store;