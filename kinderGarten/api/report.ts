import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.37:8000/api/reports/";

export async function createDailyReport(report: {
  child: number;
  date: string;
  meal: string;
  nap: string;
  activity: string;
  behavior: string;
  notes: string;
}) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.post(API_URL, report, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getReports(childId?: number, date?: string) {
  const token = await AsyncStorage.getItem("access_token");
  const params: any = {};
  if (childId) params.child = childId;
  if (date) params.date = date;

  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}
