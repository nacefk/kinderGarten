import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";

export interface Payment {
  id: number;
  child: number;
  child_name: string;
  child_avatar: string | null;
  date_of_payment: string;
  status: PaymentStatus;
  amount: string;
  description: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch payments for a specific child
 */
export async function getPaymentsByChild(childId: number): Promise<Payment[]> {
  try {
    const res = await api.get(`${API_ENDPOINTS.CHILDREN_PAYMENTS}child/${childId}/`);
    return Array.isArray(res.data) ? res.data : res.data?.results || [];
  } catch (err: any) {
    console.error("❌ [API] Error fetching payments for child", childId, ":", err.message);
    throw err;
  }
}

/**
 * Fetch all payments across all children.
 * Fetches children list, then each child's payments via /payments/child/{id}/.
 */
export async function getAllPayments(statusFilter?: PaymentStatus): Promise<Payment[]> {
  try {
    const res = await api.get(API_ENDPOINTS.CHILDREN);
    const children = res.data?.results || res.data || [];
    const payments: Payment[] = [];

    // Fetch payments for all children in parallel
    const results = await Promise.allSettled(
      children.map(async (child: any) => {
        const payRes = await api.get(`${API_ENDPOINTS.CHILDREN_PAYMENTS}child/${child.id}/`);
        const childPayments = Array.isArray(payRes.data) ? payRes.data : payRes.data?.results || [];
        console.log(`📦 [Payments] Child "${child.name}" (id=${child.id}) raw payments:`, JSON.stringify(childPayments));
        return childPayments.map((p: any) => ({
          ...p,
          child: child.id,
          child_name: p.child_name || child.name,
          child_avatar: child.avatar || null,
        }));
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        payments.push(...result.value);
      }
    }

    if (statusFilter) {
      return payments.filter((p) => p.status === statusFilter);
    }
    return payments;
  } catch (err: any) {
    console.error("❌ [API] Error fetching all payments:", err.message);
    throw err;
  }
}

/**
 * Create a new payment
 */
export async function createPayment(data: {
  child: number;
  date_of_payment: string;
  status: PaymentStatus;
  amount: string;
  description?: string;
}): Promise<Payment> {
  const res = await api.post(
    `${API_ENDPOINTS.CHILDREN_PAYMENTS}create_payment/`,
    data
  );
  return res.data;
}

/**
 * Update a payment
 */
export async function updatePayment(
  id: number,
  data: Partial<Pick<Payment, "status" | "amount" | "description" | "date_of_payment" | "child">>
): Promise<Payment> {
  // Try detail endpoint first, then fallback to update_payment action
  const url = `${API_ENDPOINTS.CHILDREN_PAYMENTS}${id}/`;
  console.log("📤 [Payments] PATCH URL:", url, "data:", data);
  try {
    const res = await api.patch(url, data);
    return res.data;
  } catch (err: any) {
    console.error("❌ [Payments] PATCH failed:", err.response?.status, err.response?.data);
    throw err;
  }
}

/**
 * Delete a payment
 */
export async function deletePayment(id: number): Promise<void> {
  await api.delete(`${API_ENDPOINTS.CHILDREN_PAYMENTS}${id}/`);
}
