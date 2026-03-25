import type { CreditFormData } from "./types";

export function maskSsn(ssn: string): string {
  const digits = ssn.replace(/\D/g, "");
  if (digits.length < 4) return "XXX-XX-XXXX";
  return `XXX-XX-${digits.slice(-4)}`;
}

export function formatSsnInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

export function emptyCreditForm(): CreditFormData {
  return { ssn: "", street: "", apt: "", city: "", state: "", zip: "" };
}

export function formatAddressLine(form: CreditFormData): string {
  const line1 = [form.street.trim(), form.apt.trim()].filter(Boolean).join(", ");
  return `${line1}, ${form.city.trim()}, ${form.state.trim()} ${form.zip.trim()}`;
}
