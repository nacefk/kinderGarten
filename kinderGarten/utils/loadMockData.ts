import { useAppStore } from "../store/useAppStore";
import mockData from "../mockData.json";

export const loadMockData = () => {
  const { setData } = useAppStore.getState();

  // Loop through screens
  Object.values(mockData.screens).forEach((screen: any) => {
    screen.apiCalls.forEach((api: any) => {
      setData(api.storeKey, api.data);
    });
  });
};
