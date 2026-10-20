// Set when registering and removed when the onboarding is finished.
const KEY = "arca:onboarding-pending";

// Storage can be blocked (private mode, disabled site data); then the onboarding just isn't enforced
export function markOnboardingPending(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
}

export function clearOnboardingPending(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function isOnboardingPending(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
