// Approve Patients and Generate IDs Script
// This script approves pending patients and assigns unique Patient IDs
// Usage: npx ts-node scripts/approveAndGenerateIds.ts

import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/user';
import { connectMongoDB } from '../src/lib/mongodb';

interface ApprovalOptions {
  approveAll?: boolean;
  specificEmails?: string[];
  limit?: number;
}

async function generateNextPatientId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PT${year}`;
  
  // Find the highest existing patient ID for this year
  const lastPatient = await User.findOne({
    patientId: { $regex: `^${prefix}`, $ne: null }
  }).sort({ patientId: -1 });
  
  let sequence = 1;
  if (lastPatient && lastPatient.patientId) {
    const lastSequence = parseInt(lastPatient.patientId.substring(prefix.length + 1));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
}

async function approvePatient(patientId: string, adminId?: string): Promise<{ success: boolean; patientId: string | null; email: string }> {
  try {
    const patient = await User.findById(patientId);
    
    if (!patient) {
      console.log(`   ❌ Patient not found: ${patientId}`);
      return { success: false, patientId: null, email: '' };
    }

    if (patient.role !== 'patient') {
      console.log(`   ❌ User is not a patient: ${patient.email}`);
      return { success: false, patientId: null, email: patient.email };
    }

    if (patient.isApproved) {
      console.log(`   ℹ️  Patient already approved: ${patient.email} (ID: ${patient.patientId})`);
      return { success: true, patientId: patient.patientId, email: patient.email };
    }

    // Generate new Patient ID
    const newPatientId = await generateNextPatientId();
    
    // Update patient
    await User.findByIdAndUpdate(patientId, {
      $set: {
        isApproved: true,
        patientId: newPatientId,
        approvedAt: new Date(),
        approvedBy: adminId ? new mongoose.Types.ObjectId(adminId) : null,
        isRejected: false,
        rejectionReason: null,
        rejectedAt: null,
        rejectedBy: null
      }
    });

    console.log(`   ✅ Approved: ${patient.email} → ${newPatientId}`);
    return { success: true, patientId: newPatientId, email: patient.email };

  } catch (error: any) {
    console.error(`   ❌ Error approving patient:`, error.message);
    return { success: false, patientId: null, email: '' };
  }
}

async function approvePatients(options: ApprovalOptions = {}) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Starting patient approval process...\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Build query
    let query: any = { 
      role: 'patient',
      isApproved: false,
      isRejected: { $ne: true }
    };

    // If specific emails provided, filter by them
    if (options.specificEmails && options.specificEmails.length > 0) {
      query.email = { $in: options.specificEmails };
    }

    // Fetch pending patients
    const pendingPatients = await User.find(query)
      .sort({ createdAt: 1 })
      .limit(options.limit || 1000);

    if (pendingPatients.length === 0) {
      console.log('ℹ️  No pending patients found matching criteria\n');
      await mongoose.disconnect();
      return;
    }

    console.log(`📊 Found ${pendingPatients.length} pending patient(s) to approve\n`);

    // Display patients
    console.log('Pending Patients:');
    console.log('─────────────────────────────────────────────────────');
    pendingPatients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.firstName} ${patient.lastName}`);
      console.log(`   Email: ${patient.email}`);
      console.log(`   Registered: ${patient.createdAt?.toLocaleDateString() || 'Unknown'}`);
      console.log(`   Conditions: ${[
        patient.diabetes ? 'Diabetes' : '',
        patient.hypertension ? 'Hypertension' : '',
        patient.cardiovascular ? 'Cardiovascular' : ''
      ].filter(Boolean).join(', ') || 'None specified'}`);
      console.log('');
    });

    if (!options.approveAll) {
      console.log('⚠️  DRY RUN MODE - No changes made');
      console.log('\nTo approve these patients, run with --approve-all flag:');
      console.log('npx ts-node scripts/approveAndGenerateIds.ts --approve-all\n');
      await mongoose.disconnect();
      return;
    }

    // Approve patients
    console.log('\n🚀 Approving patients...\n');
    
    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];

    for (const patient of pendingPatients) {
      const result = await approvePatient(patient._id.toString());
      
      if (result.success) {
        successCount++;
        results.push({
          email: result.email,
          patientId: result.patientId,
          status: 'approved'
        });
      } else {
        failCount++;
        results.push({
          email: result.email,
          patientId: null,
          status: 'failed'
        });
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 Approval Summary:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Successfully approved: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('');

    if (successCount > 0) {
      console.log('📋 Approved Patients:');
      console.log('─────────────────────────────────────────────────────');
      results
        .filter(r => r.status === 'approved')
        .forEach((r, index) => {
          console.log(`${index + 1}. ${r.email} → ${r.patientId}`);
        });
      console.log('');
    }

    // Final statistics
    const stats = {
      totalPatients: await User.countDocuments({ role: 'patient' }),
      approvedPatients: await User.countDocuments({ role: 'patient', isApproved: true }),
      rejectedPatients: await User.countDocuments({ role: 'patient', isRejected: true }),
      pendingPatients: await User.countDocuments({ 
        role: 'patient', 
        isApproved: false, 
        isRejected: { $ne: true }
      }),
      patientsWithIds: await User.countDocuments({ 
        role: 'patient', 
        patientId: { $ne: null, $exists: true }
      })
    };

    console.log('📊 Current Database Status:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Patients:           ${stats.totalPatients}`);
    console.log(`Approved:                 ${stats.approvedPatients}`);
    console.log(`Rejected:                 ${stats.rejectedPatients}`);
    console.log(`Pending:                  ${stats.pendingPatients}`);
    console.log(`With Patient IDs:         ${stats.patientsWithIds}`);
    
    const approvalRate = stats.totalPatients > 0 
      ? ((stats.approvedPatients / stats.totalPatients) * 100).toFixed(1)
      : '0.0';
    console.log(`Approval Rate:            ${approvalRate}%`);
    console.log('');

    console.log('✅ Approval process completed successfully!\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Approval process failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

async function approveSpecificPatient(email: string) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    const patient = await User.findOne({ email, role: 'patient' });

    if (!patient) {
      console.log(`❌ Patient not found with email: ${email}\n`);
      await mongoose.disconnect();
      return;
    }

    console.log(`📋 Patient Details:`);
    console.log(`   Name: ${patient.firstName} ${patient.lastName}`);
    console.log(`   Email: ${patient.email}`);
    console.log(`   Current Status: ${patient.isApproved ? 'Approved' : patient.isRejected ? 'Rejected' : 'Pending'}`);
    if (patient.patientId) {
      console.log(`   Patient ID: ${patient.patientId}`);
    }
    console.log('');

    if (patient.isApproved) {
      console.log(`ℹ️  Patient is already approved\n`);
      await mongoose.disconnect();
      return;
    }

    console.log('🚀 Approving patient...\n');
    const result = await approvePatient(patient._id.toString());

    if (result.success) {
      console.log(`\n✅ Patient approved successfully!`);
      console.log(`   Patient ID: ${result.patientId}\n`);
    } else {
      console.log(`\n❌ Failed to approve patient\n`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

async function fixExistingApprovedPatients() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    console.log('🔧 Fixing approved patients without Patient IDs...\n');

    // Find approved patients without Patient IDs
    const patientsNeedingIds = await User.find({
      role: 'patient',
      isApproved: true,
      $or: [
        { patientId: null },
        { patientId: { $exists: false } }
      ]
    }).sort({ createdAt: 1 });

    if (patientsNeedingIds.length === 0) {
      console.log('ℹ️  All approved patients already have Patient IDs\n');
      await mongoose.disconnect();
      return;
    }

    console.log(`📊 Found ${patientsNeedingIds.length} approved patients without Patient IDs\n`);

    let successCount = 0;
    
    for (const patient of patientsNeedingIds) {
      try {
        const newPatientId = await generateNextPatientId();
        
        await User.findByIdAndUpdate(patient._id, {
          $set: { patientId: newPatientId }
        });

        console.log(`   ✅ Assigned ${newPatientId} → ${patient.email}`);
        successCount++;
      } catch (error: any) {
        console.log(`   ❌ Failed for ${patient.email}: ${error.message}`);
      }
    }

    console.log(`\n✅ Fixed ${successCount} out of ${patientsNeedingIds.length} patients\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const approveAll = args.includes('--approve-all');
const emailArg = args.find(arg => arg.startsWith('--email='));
const fixExisting = args.includes('--fix-existing');
const limitArg = args.find(arg => arg.startsWith('--limit='));

// Run script
if (require.main === module) {
  if (fixExisting) {
    // Fix existing approved patients without IDs
    fixExistingApprovedPatients()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (emailArg) {
    // Approve specific patient by email
    const email = emailArg.split('=')[1];
    approveSpecificPatient(email)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    // Approve all pending patients (or dry run)
    const options: ApprovalOptions = {
      approveAll,
      limit: limitArg ? parseInt(limitArg.split('=')[1]) : undefined
    };

    approvePatients(options)
      .then(() => {
        if (!approveAll) {
          console.log('💡 Usage Examples:');
          console.log('   Approve all pending patients:');
          console.log('   npx ts-node scripts/approveAndGenerateIds.ts --approve-all\n');
          console.log('   Approve specific patient by email:');
          console.log('   npx ts-node scripts/approveAndGenerateIds.ts --email=patient@example.com\n');
          console.log('   Fix existing approved patients without IDs:');
          console.log('   npx ts-node scripts/approveAndGenerateIds.ts --fix-existing\n');
          console.log('   Approve with limit:');
          console.log('   npx ts-node scripts/approveAndGenerateIds.ts --approve-all --limit=10\n');
        }
        process.exit(0);
      })
      .catch(() => process.exit(1));
  }
}

export { approvePatients, approvePatient, generateNextPatientId, fixExistingApprovedPatients };