import { isLocationButtonDisabled, type UserLocationStatus } from "@/lib/user-location";

interface Props { status: UserLocationStatus; onLocate: () => void }

export function UserLocationControl({ status, onLocate }: Props) {
  const loading = isLocationButtonDisabled(status);
  return <button type="button" onClick={onLocate} disabled={loading} aria-label={loading ? "Localizando você" : "Onde estou"} title="Onde estou" className={`map-control-button gap-2 px-3 disabled:cursor-wait disabled:opacity-70 ${status === "located" ? "border-blue-600 bg-blue-50 text-blue-800" : status === "error" ? "border-rose-400 text-rose-800" : ""}`}>
    {loading ? <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-hidden="true" /> : <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="9" /></svg>}
    <span className="hidden min-[375px]:inline">{loading ? "Localizando" : "Onde estou"}</span>
  </button>;
}
