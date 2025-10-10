export const formatDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString();
};

export const getAge = (birthdate?: string) => {
  if (!birthdate) return "";
  const parsed = new Date(birthdate);
  const today = new Date();
  let years = today.getFullYear() - parsed.getFullYear();
  let months = today.getMonth() - parsed.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 1) return `${months} month${months > 1 ? "s" : ""}`;
  return `${years} year${years > 1 ? "s" : ""}${months > 0 ? ` ${months} mo` : ""}`;
};
