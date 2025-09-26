// routes/doctorDashboardRoutes.ts
import { Router } from "express";
import Patient from "../models/patient";
import Diabetes, { IDiabetes } from "../models/diabetesModel";
import HypertensionVital, { IHypertensionVital } from "../models/hypertensionVitals";
import { formatRelativeTime } from "../utils/timeFormatter";
import { evaluateRiskLevel } from "../utils/aiRiskEvaluator";

const router = Router();

/**
 * Utility: Calculate age from DOB
 */
function calculateAge(dob: Date): number {
    const diff = Date.now() - dob.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
}

/**
 * Utility: Calculate BMI
 */
function calculateBMI(weight: number, height: number): number | null {
    if (!weight || !height) return null;
    return +(weight / Math.pow(height / 100, 2)).toFixed(1); // height in cm
}

/**
 * Utility: Determine risk level based on vitals + demographics
 */
type RiskLevel = "low" | "high" | "critical";

/* function determineRiskLevel(patient: any, vitals: any): RiskLevel {
    const age = calculateAge(patient.dob);
    const bmi = calculateBMI(patient.weight, patient.height);
    let risk: RiskLevel = "low";

    // 🔹 Diabetes risk
    if (vitals.glucose) {
        const glucose = vitals.glucose;
        if (
            (vitals.context === "Fasting" && glucose > 180) ||
            (vitals.context === "Random" && glucose > 250)
        ) {
            return "critical"; // uncontrolled diabetes
        } else if (
            (vitals.context === "Fasting" && glucose > 125) ||
            (vitals.context === "Random" && glucose > 200)
        ) {
            risk = "high";
        } else if (glucose > 100) {
            risk = "medium";
        }
    }
    // 🔹 Hypertension risk
    if (vitals.bloodPressure) {
        const [systolic, diastolic] = vitals.bloodPressure
            .split("/")
            .map((n: string) => parseInt(n, 10));

        if (systolic > 180 || diastolic > 120) {
            return "critical"; // hypertensive crisis
        } else if (systolic > 160 || diastolic > 100) {
            risk = "high";
        } else if (systolic > 140 || diastolic > 90) {
            if (risk === "low") risk = "medium";
        }
    }

    // 🔹 Heart rate risk
    if (vitals.heartRate) {
        if (vitals.heartRate < 40 || vitals.heartRate > 150) {
            return "critical";
        } else if (vitals.heartRate < 50 || vitals.heartRate > 120) {
            risk = "high";
        }
    }

    // --- Oxygen Saturation ---
    if (vitals.oxygenSat) {
        if (vitals.oxygenSat < 85) {
            return "critical";
        } else if (vitals.oxygenSat < 90) {
            risk = "high";
        } else if (vitals.oxygenSat < 95) {
            if (risk === "low") risk = "medium";
        }
    }

    // --- Temperature ---
    if (vitals.temperature) {
        if (vitals.temperature > 40) {
            return "critical";
        } else if (vitals.temperature > 38.5) {
            risk = "high";
        } else if (vitals.temperature > 37.5) {
            if (risk === "low") risk = "medium";
        }
    }

    // --- Age factor ---
    if (age > 75 && (risk as RiskLevel) !== "critical") {
        if (risk === "low") risk = "medium";
        else if (risk === "medium") risk = "high";
    }

    // --- BMI factor ---
    if (bmi && (bmi < 18.5 || bmi > 35)) {
        if (risk === "low") risk = "medium";
    }

    // 🔹 Age factor
    if (age > 65 && risk !== "high") {
        risk = "medium";
    }

    // 🔹 BMI factor
    if (bmi && (bmi < 18.5 || bmi > 30)) {
        if (risk === "low") risk = "medium";
    }

    return risk;
} */

/**
 * @route   GET /patients
 * @desc    Get all patients with their latest vitals
 */
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

                // 🔹 Calculate Risk Level
                const riskLevel = await evaluateRiskLevel(patient.toObject(), vitals);/* determineRiskLevel(patient.toObject(), vitals); */

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

/**
 * @route   GET /patients/:id
 * @desc    Get single patient with latest vitals
 */
router.get("/:id", async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ error: "Patient not found" });

        let vitals: any = {};

        // 🔹 Latest Diabetes Record
        const diabetes: IDiabetes | null = await Diabetes.findOne({
            userId: patient.userId,
        })
            .sort({ createdAt: -1 })
            .lean<IDiabetes>();

        if (diabetes) {
            vitals.glucose = diabetes.glucose;
            vitals.context = diabetes.context;
        }

        // 🔹 Latest Hypertension Record
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

        // 🔹 Calculate Risk Level
        const riskLevel = await evaluateRiskLevel(patient.toObject(), vitals);/* determineRiskLevel(patient.toObject(), vitals); */

        res.json({
            ...patient.toObject(),
            vitals,
            riskLevel,
            // Explicit conditions from patient collection
            conditions: {
                diabetes: patient.diabetes,
                hypertension: patient.hypertension,
            },
        });
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


export default router;
