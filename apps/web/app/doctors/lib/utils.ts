export function getRiskColor(risk: "critical" | "high" | "medium" | "low" | string): string {
  switch (risk) {
    case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "high": return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low": return "text-green-600 bg-green-50 boredr-green-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
}


// Helper to format relative time (frontend fallback)
export const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const now = new Date().getTime();
  const diff = Math.floor((now - date.getTime()) / 1000); // seconds

  if (diff < 60) return `${diff} sec${diff !== 1 ? "s" : ""} ago`;
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  }
  if (diff < 86400) {
    const hrs = Math.floor(diff / 3600);
    return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diff / 86400);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
};
