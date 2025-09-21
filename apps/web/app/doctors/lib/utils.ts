export function getRiskColor(risk: "critical" | "high" | "medium" | "low" | string): string {
  switch (risk) {
    case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "high": return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low": return "text-green-600 bg-green-50 boredr-green-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
}
