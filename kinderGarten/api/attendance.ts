// 📄 src/api/attendance.ts

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.0.37:8000/api/attendance/";

/**
 * ✅ Get presence summary
 * Returns: { present: number, absent: number }
 */
export async function getAttendanceSummary() {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.get(`${BASE_URL}summary/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/**
 * ✅ Get pending extra-hour requests
 * Returns: [{ id, child_name, start, end, status }]
 */
export async function getPendingExtraHours() {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.get(`${BASE_URL}extra/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
export async function saveAttendanceRecords(records: any[]) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.post(
    `${BASE_URL}update/`,
    { records },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
