import { useAppStore } from "../store/useAppStore";
import mockData from "../mockData.json";

export const loadMockData = () => {
  const { setData } = useAppStore.getState();

  const loadApiCalls = (apiCalls: any[]) => {
    apiCalls.forEach((api: any) => {
      setData(api.storeKey, api.data);
    });
  };

  // 🔹 Load parent screens (if any)
  if (mockData.screens) {
    Object.values(mockData.screens).forEach((screen: any) => {
      if (screen.apiCalls) loadApiCalls(screen.apiCalls);
    });
  }

  // 🔹 Load admin section (new dataset)
  if (mockData.admin && Array.isArray(mockData.admin.apiCalls)) {
    loadApiCalls(mockData.admin.apiCalls);
  }

  console.log("✅ Mock data loaded successfully (Parent + Admin).");
};
