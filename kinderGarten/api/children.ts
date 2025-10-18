import { api } from "./api";

export async function getChildren() {
  const res = await api.get("children/");
  return res.data;
}
