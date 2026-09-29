import { createSlice } from '@reduxjs/toolkit';

// Device-level preferences kept across launches (and across logouts: this slice is not
// touched by the auth reducers). Persisted in store/index.js.
const settingsSlice = createSlice({
  name: 'settings',
  initialState: { darkMode: false },
  reducers: {
    setDarkMode: (state, action) => {
      state.darkMode = Boolean(action.payload);
    },
  },
});

export const { setDarkMode } = settingsSlice.actions;
export default settingsSlice.reducer;
