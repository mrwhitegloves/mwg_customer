import { createSlice } from "@reduxjs/toolkit";

const vehicleSlice = createSlice({
  name: "vehicle",
  initialState: {
    version: 0, // simple change tracker
  },
  reducers: {
    vehicleUpdated: (state) => {
      state.version += 1;
    },
  },
});

export const { vehicleUpdated } = vehicleSlice.actions;
export default vehicleSlice.reducer;
