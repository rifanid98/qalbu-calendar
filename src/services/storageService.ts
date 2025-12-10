import { AppState, UserProfile } from '../types';

const STORAGE_KEY = 'kalender_puasa_data_v1';

const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  name: 'Saya',
  completedDates: {}
};

const DEFAULT_STATE: AppState = {
  profiles: [DEFAULT_PROFILE],
  activeProfileId: 'default',
  theme: 'system',
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return DEFAULT_STATE;
    return JSON.parse(serialized);
  } catch (e) {
    console.error("Failed to load state", e);
    return DEFAULT_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const resetData = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};
