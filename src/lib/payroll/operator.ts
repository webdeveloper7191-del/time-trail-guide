/**
 * Payroll operator identity.
 *
 * Until SSO identities are wired into the payroll module we keep the name of
 * the person driving payroll in local storage so maker-checker segregation
 * (creator ≠ approver) has something to compare against and audit trails read
 * sensibly.
 */

const KEY = 'payroll:operator';

export function getPayrollOperator(): string {
  try {
    return localStorage.getItem(KEY) || 'Payroll Officer';
  } catch {
    return 'Payroll Officer';
  }
}

export function setPayrollOperator(name: string) {
  try { localStorage.setItem(KEY, name.trim()); } catch {/* noop */}
}
