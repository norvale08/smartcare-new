// routes/doctorDashboardRoutes.ts
import { Router } from "express";
import Patient from "../models/patient";
import Diabetes, { IDiabetes } from "../models/diabetesModel";
import HypertensionVital, { IHypertensionVital } from "../models/hypertensionVitals";
import { formatRelativeTime } from "../utils/timeFormatter";
import { evaluateRiskLevel } from "../utils/aiRiskEvaluator";
import { getWeeklyWindow } from "../utils/getDateWindow";
import { fill7Days, aggregateDailyBloodPressure } from "../utils/aggregateDaily";
import { classifyVital } from "../utils/aiVitalClassifier";

const router = Router();

// Calculate age from DOB
function calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
}

// Calculate BMI
function calculateBMI(weight: number, height: number): number | null {
    if (!weight || !height) return null;
    return +(weight / Math.pow(height / 100, 2)).toFixed(1); // height in cm
}

// Determine risk level based on vitals + demographics
type RiskLevel = "low" | "high" | "critical";


// Get all patients with their latest vitals
router.get("/", async (req, res) => {
    try {
        const { search } = req.query;
        const query: any = {};

        if (search) {
            query.fullName = { $regex: search, $options: "i" }; // case-insensitive search
        }
        const patients = await Patient.find();

        const patientsWithVitals = await Promise.all(
            patients.map(async (patient) => {
                let vitals: any = {};

                // Diabetes latest record
                const diabetes: IDiabetes | null = await Diabetes.findOne({
                    userId: patient.userId,
                })
                    .sort({ createdAt: -1 })
                    .lean<IDiabetes>();

                if (diabetes) {
                    vitals.glucose = diabetes.glucose;
                    vitals.context = diabetes.context;
                }

                // Hypertension latest record
                const hypertension: IHypertensionVital | null =
                    await HypertensionVital.findOne({ userId: patient.userId })
                        .sort({ createdAt: -1 })
                        .lean<IHypertensionVital>();

                if (hypertension) {
                    vitals.bloodPressure = `${hypertension.systolic}/${hypertension.diastolic}`;
                    vitals.heartRate = hypertension.heartRate;
                }

                const bmi = calculateBMI(patient.weight, patient.height);
                if (bmi) vitals.bmi = bmi;

                // Calculate Risk Level
                const riskLevel = await evaluateRiskLevel(patient.toObject(), vitals);

                return {
                    ...patient.toObject(),
                    vitals,
                    riskLevel,
                    // Explicit conditions from patient collection
                    conditions: {
                        diabetes: patient.diabetes,
                        hypertension: patient.hypertension,
                    },
                };
            })
        );

        res.json(patientsWithVitals);
    } catch (err: any) {
        console.error("Error in GET /doctorDashboard:", err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

router.get("/api/doctorDashboard", async (req, res) => {
    try {
        const patients = await Patient.find();

        const transformed = await Promise.all(
            patients.map(async (p) => {
                // Get diabetes latest record
                const diabetes: IDiabetes | null = await Diabetes.findOne({ userId: p.userId })
                    .sort({ createdAt: -1 })
                    .lean<IDiabetes>();

                // Get hypertension latest record
                const hypertension: IHypertensionVital | null = await HypertensionVital.findOne({
                    userId: p.userId,
                })
                    .sort({ createdAt: -1 })
                    .lean<IHypertensionVital>();

                // Gather timestamps
                const timestamps: Date[] = [];

                // Patient
                if (p.createdAt) timestamps.push(new Date(p.createdAt));
                if ((p as any).updatedAt) timestamps.push(new Date((p as any).updatedAt));

                // Diabetes
                if (diabetes?.createdAt) timestamps.push(new Date(diabetes.createdAt));
                if ((diabetes as any)?.updatedAt) timestamps.push(new Date((diabetes as any).updatedAt));

                // Hypertension
                if (hypertension?.createdAt) timestamps.push(new Date(hypertension.createdAt));
                if ((hypertension as any)?.updatedAt) timestamps.push(new Date((hypertension as any).updatedAt));

                // Pick the latest timestamp
                const lastUpdateDate =
                    timestamps.length > 0
                        ? new Date(Math.max(...timestamps.map((d) => d.getTime())))
                        : null;

                return {
                    ...p.toObject(),
                    lastUpdate: lastUpdateDate ? formatRelativeTime(lastUpdateDate) : "N/A",
                };
            })
        );

        res.json(transformed);
    } catch (err) {
        console.error("Error fetching patients:", err);
        res.status(500).json({ error: "Failed to fetch patients" });
    }
});



// Vital Trends

// GET /api/doctorDashboard/vitalTrends
router.get("/vitalTrends", async (req, res) => {
    try {
        const { start, end } = getWeeklyWindow();

        const patients = await Patient.find({
            updatedAt: { $gte: start, $lte: end },
        }).lean();

        const diabetes = await Diabetes.find({
            createdAt: { $gte: start, $lte: end },
        }).lean();

        const hypertension = await HypertensionVital.find({
            createdAt: { $gte: start, $lte: end },
        }).lean();

        // Aggregate per day
        const heartRate = fill7Days(
            hypertension.reduce((acc, r) => {
                const dayKey = new Date(r.createdAt).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                });
                if (!acc[dayKey]) acc[dayKey] = [];
                acc[dayKey].push(r.heartRate);
                return acc;
            }, {} as Record<string, number[]>),
            "heartRate"
        );

        const bloodPressure = aggregateDailyBloodPressure(hypertension);

        const glucose = fill7Days(
            diabetes.reduce((acc, r) => {
                const dayKey = new Date(r.createdAt).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                });
                if (!acc[dayKey]) acc[dayKey] = [];
                acc[dayKey].push(r.glucose);
                return acc;
            }, {} as Record<string, number[]>),
            "glucose"
        );

        // BMI per patient (derive then group daily)
        const bmiRecords = patients
            .map((p) => ({
                createdAt: p.updatedAt || p.createdAt,
                bmi:
                    p.weight && p.height
                        ? +(p.weight / Math.pow(p.height / 100, 2)).toFixed(1)
                        : null,
            }))
            .filter((r) => r.bmi !== null);

        const bmi = fill7Days(
            bmiRecords.reduce((acc, r) => {
                const dayKey = new Date(r.createdAt).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                });
                if (!acc[dayKey]) acc[dayKey] = [];
                acc[dayKey].push(r.bmi as number);
                return acc;
            }, {} as Record<string, number[]>),
            "bmi"
        );

        res.json({ heartRate, bloodPressure, glucose, bmi });
    } catch (err: any) {
        console.error("Error in GET /vitalTrends:", err.message);
        res.status(500).json({ error: err.message });
    }
});


router.get("/anomalyDistribution", async (req, res) => {
    try {
        const patients = await Patient.find().lean();
        const diabetes = await Diabetes.find().lean();
        const hypertension = await HypertensionVital.find().lean();

        let distribution: Record<string, { normal: number; abnormal: number }> = {
            HeartRate: { normal: 0, abnormal: 0 },
            BloodPressure: { normal: 0, abnormal: 0 },
            Glucose: { normal: 0, abnormal: 0 },
            BMI: { normal: 0, abnormal: 0 },
        };

        // Process BMI
        for (const p of patients) {
            if (p.weight && p.height) {
                const bmi = +(p.weight / Math.pow(p.height / 100, 2)).toFixed(1);
                const status = await classifyVital("BMI", bmi, {
                    age: p.age,
                    gender: p.gender,
                    conditions: { diabetes: p.diabetes, hypertension: p.hypertension },
                });
                distribution.BMI[status]++;
            }
        }

        // Process Glucose
        for (const d of diabetes) {
            const patient = patients.find((p) => String(p.userId) === String(d.userId));
            const status = await classifyVital("Glucose", d.glucose, {
                age: patient ? calculateAge(patient.dob) : undefined,
                gender: patient?.gender,
                conditions: { diabetes: patient?.diabetes, hypertension: patient?.hypertension },
                context: d.context,
            });
            distribution.Glucose[status]++;
        }

        // Process Hypertension Vitals
        for (const h of hypertension) {
            const patient = patients.find((p) => String(p.userId) === String(h.userId));

            const statusHR = await classifyVital("HeartRate", h.heartRate, {
                age: patient ? calculateAge(patient.dob) : undefined,
                gender: patient?.gender,
                conditions: { diabetes: patient?.diabetes, hypertension: patient?.hypertension },
            });
            distribution.HeartRate[statusHR]++;

            const statusBP = await classifyVital("BloodPressure", `${h.systolic}/${h.diastolic}`, {
                age: patient ? calculateAge(patient.dob) : undefined,
                gender: patient?.gender,
                conditions: { diabetes: patient?.diabetes, hypertension: patient?.hypertension },
            });
            distribution.BloodPressure[statusBP]++;
        }

        // Convert counts to percentages + include raw counts
        const anomalyDistributionBar = Object.entries(distribution).map(
            ([vital, counts]) => {
                const total = counts.normal + counts.abnormal;
                return {
                    vital,
                    normal: total > 0 ? Math.round((counts.normal / total) * 100) : 0,
                    abnormal: total > 0 ? Math.round((counts.abnormal / total) * 100) : 0,
                    total,
                    normalCount: counts.normal,
                    abnormalCount: counts.abnormal,
                };
            }
        );

        res.json({ anomalyDistributionBar });
    } catch (err: any) {
        console.error("Error in GET /anomalyDistribution:", err.message);
        res.status(500).json({ error: err.message });
    }
});


export default router;
