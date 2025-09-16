// DownloadButton.tsx
import { Download } from "lucide-react";

interface DownloadButtonProps {
  patientId: string;
  token: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ patientId, token }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reports/patient/${patientId}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `patient_report_${patientId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <button
      className="p-2 hover:bg-gray-100 rounded-lg"
      onClick={handleDownload}
      title="Download PDF Report"
    >
      <Download className="w-5 h-5" />
    </button>
  );
};

export default DownloadButton;
