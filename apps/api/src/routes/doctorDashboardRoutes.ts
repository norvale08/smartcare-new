// routes/doctorDashboardRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Patient from "../models/patient";
import Diabetes, { IDiabetes } from "../models/diabetesModel";
import HypertensionVital, { IHypertensionVital } from "../models/hypertensionVitals";
import { formatRelativeTime } from "../utils/timeFormatter";
import { evaluateRiskLevel } from "../utils/RiskEvaluator";
import { getWeeklyWindow } from "../utils/getDateWindow";
import { fill7Days, aggregateDailyBloodPressure } from "../utils/aggregateDaily";
import { classifyVital } from "../utils/VitalClassifier";
import User from "../models/user";

interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role?: string;
    };
}

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

// --- Auth Middleware ---
const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.body.token;
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret") as any;

        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        console.log("✅ Authenticated user:", req.user);
        next();
    } catch (error) {
        console.error("❌ Token verification failed:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};

// --- Doctor Info ---
router.get("/doctor", authenticateUser, async (req: AuthRequest, res) => {
    try {
        if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

        const doctor = await User.findById(req.user.id).select("firstName lastName fullName role");
        if (!doctor || doctor.role !== "doctor") return res.status(404).json({ error: "Doctor not found" });

        const doctorName = doctor.fullName || `${doctor.firstName} ${doctor.lastName}`;
        res.json({ name: doctorName });
    } catch (err) {
        console.error("❌ Error fetching doctor:", err);
        res.status(500).json({ error: "Failed to fetch doctor info" });
    }
});

// --- Assigned Patients (FIXED) ---
router.get("/assignedPatients", authenticateUser, async (req: AuthRequest, res) => {
    try {
        const { search } = req.query;
        if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

        console.log(`🔍 Doctor ${req.user.id} requesting assigned patients`);

        // FIXED: Query User model for patients assigned to this doctor
        const userQuery: any = { 
            role: "patient", 
            assignedDoctor: req.user.id 
        };

        if (search) {
            userQuery.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        // Get patient users assigned to this doctor
        const patientUsers = await User.find(userQuery)
            .select("_id firstName lastName fullName email phoneNumber condition diabetes hypertension")
            .lean();

        console.log(`📊 Found ${patientUsers.length} patient users for doctor ${req.user.id}`);

        // Get their corresponding Patient records
        const patientUserIds = patientUsers.map(u => u._id);
        const patientRecords = await Patient.find({ userId: { $in: patientUserIds } })
            .lean();

        console.log(`📋 Found ${patientRecords.length} patient records`);

        // Create a map for quick lookup
        const patientRecordMap = new Map();
        patientRecords.forEach((record: any) => {
            patientRecordMap.set(record.userId.toString(), record);
        });

        // Build response with vitals and location data
        const patientsWithVitals = await Promise.all(
            patientUsers.map(async (user: any) => {
                const patientRecord = patientRecordMap.get(user._id.toString());
                
                let vitals: any = {};

                // Diabetes - using user._id as userId
                const diabetes: IDiabetes | null = await Diabetes.findOne({ userId: user._id })
                    .sort({ createdAt: -1 })
                    .lean<IDiabetes>();
                if (diabetes) {
                    vitals.glucose = diabetes.glucose;
                    vitals.context = diabetes.context;
                }

                // Hypertension - using user._id as userId
                const hypertension: IHypertensionVital | null = await HypertensionVital.findOne({ userId: user._id })
                    .sort({ createdAt: -1 })
                    .lean<IHypertensionVital>();
                if (hypertension) {
                    vitals.bloodPressure = `${hypertension.systolic}/${hypertension.diastolic}`;
                    vitals.heartRate = hypertension.heartRate;
                }

                // BMI from patient record
                if (patientRecord) {
                    const bmi = calculateBMI(patientRecord.weight, patientRecord.height);
                    if (bmi) vitals.bmi = bmi;
                }

                // Risk Level
                const patientData = patientRecord ? patientRecord : {
                    diabetes: user.diabetes,
                    hypertension: user.hypertension
                };
                const riskLevel = await evaluateRiskLevel(patientData, vitals);

                // Location handling - from Patient record
                const locationData = patientRecord?.location;

                // Debug: Log the raw patient data
                console.log(`\n🔍 Patient: ${user.fullName || `${user.firstName} ${user.lastName}`}`);
                console.log(`   User ID: ${user._id}`);
                console.log(`   Patient Record ID: ${patientRecord?._id}`);
                console.log(`   location field exists: ${!!locationData}`);
                console.log(`   location data:`, JSON.stringify(locationData, null, 2));

                // Format location to match what the frontend expects
                let formattedLocation = null;
                if (locationData && locationData.lat && locationData.lng) {
                    formattedLocation = {
                        lat: locationData.lat,
                        lng: locationData.lng,
                        address: locationData.address || `${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}`,
                        updatedAt: locationData.updatedAt || patientRecord?.updatedAt
                    };
                    console.log(`   ✅ Location formatted:`, formattedLocation);
                } else {
                    console.log(`   ⚠️ No valid location data`);
                    if (locationData) {
                        console.log(`   ⚠️ Location object exists but missing lat/lng`);
                        console.log(`   ⚠️ lat: ${locationData.lat}, lng: ${locationData.lng}`);
                    }
                }

                const result = {
                    _id: user._id.toString(),
                    userId: user._id.toString(),
                    fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    firstname: patientRecord?.firstname || user.firstName || '',
                    lastname: patientRecord?.lastname || user.lastName || '',
                    email: user.email || patientRecord?.email || '',
                    phoneNumber: user.phoneNumber || patientRecord?.phoneNumber || '',
                    age: patientRecord?.age,
                    dob: patientRecord?.dob,
                    gender: patientRecord?.gender,
                    weight: patientRecord?.weight,
                    height: patientRecord?.height,
                    picture: patientRecord?.picture,
                    vitals,
                    riskLevel,
                    location: formattedLocation,  // Matches the relative route format
                    coordinates: formattedLocation ? { lat: formattedLocation.lat, lng: formattedLocation.lng } : null,
                    conditions: {
                        diabetes: patientRecord?.diabetes || user.diabetes || false,
                        hypertension: patientRecord?.hypertension || user.hypertension || false,
                    },
                };

                return result;
            })
        );

        // Summary logging
        const patientsWithLocation = patientsWithVitals.filter(p => p.location !== null);
        console.log(`\n📊 Summary:`);
        console.log(`   Total patients: ${patientsWithVitals.length}`);
        console.log(`   Patients with location: ${patientsWithLocation.length}`);
        
        res.json(patientsWithVitals);
    } catch (err: any) {
        console.error("❌ Error in GET /assignedPatients:", err.message, err.stack);
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