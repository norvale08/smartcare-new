import React, { Dispatch, SetStateAction } from "react";
import HypertensionAlert from "../../components/hypertension/alert";
import VitalsWithActivityInput from "./VitalsWithActivityInput";
import HealthTrends from "./HealthTrends";
import DoctorManagement from "../../components/DoctorManagement";
import NearbyClinics from "./NearbyClinics";
import MedicationAnalysisPage from "../../components/hypertension/medicationAnalysis";
import MedicationReminders from "./MedicationReminders";
import LifestyleAssessment from "./LifestyleAssessment";
import DietRecommendations from "./DietRecommendations";
import type { LifestyleData } from "./LifestyleAssessment";
import Maps from "../../../app/components/Map"

interface TabContentProps {
  activeTab: string;
  alertRefreshToken: number;
  setAlertRefreshToken: (token: number) => void;
  vitals: any[];
  lifestyle: LifestyleData;
  setLifestyle: Dispatch<SetStateAction<LifestyleData>>;
  currentBpLevel: string;
  todayAlert: any;
  aiRecommendations: any;
  loadingAI: boolean;
  regeneratingLifestyle: boolean;
  onRegenerateLifestyle: () => void;
  dietData: any;
  dietLoading: boolean;
  onRegenerateDiet: () => void;
  patient: any;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  alertRefreshToken,
  setAlertRefreshToken,
  vitals,
  lifestyle,
  setLifestyle,
  currentBpLevel,
  todayAlert,
  aiRecommendations,
  loadingAI,
  regeneratingLifestyle,
  onRegenerateLifestyle,
  dietData,
  dietLoading,
  onRegenerateDiet,
  patient
}) => {
  const computeAge = (dob?: string) => {
    if (!dob) return undefined;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  switch (activeTab) {
    case 'vitals':
      return (
        <>
          <HypertensionAlert refreshToken={alertRefreshToken} />
          <VitalsWithActivityInput onAfterSave={() => setAlertRefreshToken(Date.now())} />
          <HealthTrends vitals={vitals} />
        </>
      );
    
    case 'doctor':
      return (
        <>
          <DoctorManagement condition="hypertension" />
          <NearbyClinics />
        </>
      );
    
    case 'medicine':
      return (
        <>
          <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
            <MedicationAnalysisPage />
          </div>
          <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
            <MedicationReminders />
          </div>
        </>
      );
    
    case 'lifestyle':
      return (
        <>
          <LifestyleAssessment
            lifestyle={lifestyle}
            onLifestyleChange={setLifestyle}
            bpLevel={currentBpLevel}
            alertStatus={todayAlert.status}
            todayVitals={{
              systolic: todayAlert.systolic,
              diastolic: todayAlert.diastolic,
              heartRate: todayAlert.heartRate
            }}
            aiRecommendations={aiRecommendations}
            loadingAI={loadingAI}
            onRegenerateLifestyle={onRegenerateLifestyle}
            loadingRegenerate={regeneratingLifestyle}
          />
          <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
            <DietRecommendations 
              dietData={dietData} 
              loading={dietLoading} 
              onRegenerate={onRegenerateDiet}
              patient={patient ? {
                age: computeAge(patient?.dob),
                weight: patient?.weight,
                gender: patient?.gender
              } : undefined}
            />
          </div>
        </>
      );
    
    case 'maps':
      return (
        <div className="w-full max-w-4xl">
          {/* <NearbyClinics /> */}
          <Maps />
        </div>
      );
    
    default:
      return null;
  }
};

export default TabContent;