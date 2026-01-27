import React, { Dispatch, SetStateAction } from "react";
import HypertensionAlert from "../../components/hypertension/alert";
import VitalsWithActivityInput from "./VitalsWithActivityInput";
import VoiceControlPanel from "./VoiceControlPanel";


import HealthTrendsAndRiskTab from "./tabs/HealthTrendsAndRiskTab";
import DoctorManagement from "../../components/DoctorManagement";
import NearbyClinics from "./NearbyClinics";
import MedicationAnalysisPage from "../../components/hypertension/medicationAnalysis";
import MedicationReminders from "./MedicationReminders";
import LifestyleAssessment from "./LifestyleAssessment";
import DietRecommendations from "./DietRecommendations";
import type { LifestyleData } from "./LifestyleAssessment";
import Maps from "../../../app/components/Map"
import PatientAppointments from "../../../app/components/PatientAppointments";
import { useTranslation } from "../../../lib/hypertension/useTranslation";

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
  const sectionCardClass =
    "bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100/60 overflow-hidden";
  const sectionBodyClass = "p-5 sm:p-6";

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
          
        </>
      );
    
    case 'health-trends':
      return (
      <>
       
        <HealthTrendsAndRiskTab
          patient={patient}
          patientVitals={vitals}
        />
      </>
      );
    
    case 'doctor':
      return (
        <>
          <div className={sectionCardClass}>
            <div className={sectionBodyClass}>
              <DoctorManagement condition="hypertension" />
            </div>
          </div>
          <div className={`${sectionCardClass} mt-6`}>
            <div className={sectionBodyClass}>
              {patient && <PatientAppointments patientId={patient._id} />}
            </div>
          </div>
          {/* <NearbyClinics /> */}
        </>
      );
    
    case 'medicine':
      return (
        <>
          <div className={`${sectionCardClass} mb-6`}>
            <div className={sectionBodyClass}>
              <MedicationAnalysisPage />
            </div>
          </div>
          <div className={`${sectionCardClass} mb-6`}>
            <div className={sectionBodyClass}>
              <MedicationReminders />
            </div>
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
            patientName={patient?.fullName}
          />
          <div className={`${sectionCardClass} mb-6`}>
            <div className={sectionBodyClass}>
              <DietRecommendations 
                dietData={dietData} 
                loading={dietLoading} 
                onRegenerate={onRegenerateDiet}
                patient={patient ? {
                  name: patient?.fullName,
                  age: computeAge(patient?.dob),
                  weight: patient?.weight,
                  gender: patient?.gender
                } : undefined}
              />
            </div>
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
