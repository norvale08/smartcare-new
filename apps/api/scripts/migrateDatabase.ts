// Database Migration Script - FIXED FOR YOUR DATABASE STATE
// Your database has patients missing both patientId and isApproved fields
// Usage: npx ts-node scripts/migrateDatabase.ts

import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/user';
import { connectMongoDB } from '../src/lib/mongodb';

async function migrateDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Starting database migration...\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Step 1: Create indexes (patientId index already dropped by cleanup script)
    console.log('1️⃣  Creating indexes...');
    try {
      await User.collection.createIndex({ isRejected: 1 });
      console.log('   ✅ Created index on isRejected (if not exists)');
      
      // Create sparse unique index on patientId
      await User.collection.createIndex(
        { patientId: 1 }, 
        { unique: true, sparse: true, name: 'patientId_sparse_unique' }
      );
      console.log('   ✅ Created sparse unique index on patientId');
      
      await User.collection.createIndex({ role: 1, isApproved: 1 });
      console.log('   ✅ Created compound index on role + isApproved');
      
      await User.collection.createIndex({ role: 1, isApproved: 1, isRejected: 1 });
      console.log('   ✅ Created compound index on role + isApproved + isRejected');
    } catch (error: any) {
      if (error.code === 85 || error.code === 86 || error.code === 11000) {
        console.log('   ℹ️  Some indexes already exist, continuing...');
      } else {
        throw error;
      }
    }

    // Step 2: Add missing isApproved field to all patients
    console.log('\n2️⃣  Adding isApproved field to patients...');
    const patientsWithoutApproval = await User.find({
      role: 'patient',
      isApproved: { $exists: false }
    });
    
    if (patientsWithoutApproval.length > 0) {
      console.log(`   Found ${patientsWithoutApproval.length} patients without isApproved field`);
      
      for (const patient of patientsWithoutApproval) {
        await User.findByIdAndUpdate(patient._id, {
          $set: {
            isApproved: false,  // Default to not approved
            isRejected: false,
            rejectionReason: null,
            rejectedAt: null,
            rejectedBy: null
          }
        });
      }
      console.log(`   ✅ Added approval fields to ${patientsWithoutApproval.length} patients`);
    } else {
      console.log('   ℹ️  All patients already have isApproved field');
    }

    // Step 3: Add missing rejection fields
    console.log('\n3️⃣  Adding default rejection fields...');
    const result1 = await User.updateMany(
      { 
        role: 'patient',
        isRejected: { $exists: false }
      },
      {
        $set: {
          isRejected: false,
          rejectionReason: null,
          rejectedAt: null,
          rejectedBy: null
        }
      }
    );
    console.log(`   ✅ Updated ${result1.modifiedCount} patient records with rejection fields`);

    // Step 4: Handle patientId field - NO BULK OPERATIONS
    console.log('\n4️⃣  Adding patientId field...');
    
    // First, unset patientId for the one patient that has null
    // This ensures a clean slate
    await User.updateMany(
      {
        role: 'patient',
        patientId: null
      },
      {
        $unset: { patientId: "" }
      }
    );
    console.log('   ✅ Cleared existing null patientId values');
    
    // Now add patientId field to all patients that don't have it
    const patientsWithoutPatientId = await User.find({
      role: 'patient',
      patientId: { $exists: false }
    });
    
    if (patientsWithoutPatientId.length > 0) {
      console.log(`   Found ${patientsWithoutPatientId.length} patients without patientId field`);
      console.log('   Adding patientId field one by one...');
      
      let successCount = 0;
      for (const patient of patientsWithoutPatientId) {
        try {
          // Add patientId: null one at a time
          // The sparse index allows this because each update is separate
          await User.collection.updateOne(
            { _id: patient._id },
            { $set: { patientId: null } }
          );
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`   ... processed ${successCount}/${patientsWithoutPatientId.length}`);
          }
        } catch (error: any) {
          console.log(`   ⚠️  Error updating ${patient.email}: ${error.message}`);
        }
      }
      console.log(`   ✅ Added patientId field to ${successCount} patients`);
    } else {
      console.log('   ℹ️  All patients already have patientId field');
    }

    // Step 5: Generate Patient IDs for approved patients
    console.log('\n5️⃣  Generating Patient IDs for approved patients...');
    const approvedPatients = await User.find({
      role: 'patient',
      isApproved: true,
      $or: [
        { patientId: null },
        { patientId: { $exists: false } }
      ]
    }).sort({ createdAt: 1 });

    if (approvedPatients.length > 0) {
      console.log(`   Found ${approvedPatients.length} approved patients without Patient IDs`);
      
      const year = new Date().getFullYear();
      const prefix = `PT${year}`;
      
      // Find the highest existing patient ID for this year
      const lastPatient = await User.findOne({
        patientId: { $regex: `^${prefix}` }
      }).sort({ patientId: -1 });
      
      let sequence = 1;
      if (lastPatient && lastPatient.patientId) {
        const lastSequence = parseInt(lastPatient.patientId.substring(prefix.length + 1));
        sequence = lastSequence + 1;
      }

      console.log(`   Starting sequence from: ${sequence}`);

      // Assign Patient IDs
      for (const patient of approvedPatients) {
        const patientId = `${prefix}-${sequence.toString().padStart(4, '0')}`;
        await User.findByIdAndUpdate(patient._id, { 
          $set: { patientId }
        });
        console.log(`   ✅ Assigned ${patientId} → ${patient.email}`);
        sequence++;
      }
      
      console.log(`   ✅ Assigned ${approvedPatients.length} Patient IDs successfully`);
    } else {
      console.log('   ℹ️  No approved patients found without Patient IDs');
    }

    // Step 6: Verify data integrity
    console.log('\n6️⃣  Verifying data integrity...');
    
    // Check for duplicate Patient IDs
    const duplicates = await User.aggregate([
      { 
        $match: { 
          role: 'patient',
          patientId: { $ne: null }
        }
      },
      { 
        $group: { 
          _id: '$patientId',
          count: { $sum: 1 }
        }
      },
      { 
        $match: { 
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicates.length > 0) {
      console.log(`   ⚠️  WARNING: Found ${duplicates.length} duplicate Patient IDs:`);
      duplicates.forEach(dup => {
        console.log(`      - ${dup._id} (appears ${dup.count} times)`);
      });
    } else {
      console.log('   ✅ No duplicate Patient IDs found');
    }

    // Check for approved patients without IDs
    const approvedWithoutId = await User.countDocuments({
      role: 'patient',
      isApproved: true,
      $or: [
        { patientId: null },
        { patientId: { $exists: false } }
      ]
    });

    if (approvedWithoutId > 0) {
      console.log(`   ⚠️  WARNING: ${approvedWithoutId} approved patients still without Patient IDs`);
    } else {
      console.log('   ✅ All approved patients have Patient IDs');
    }

    // Check for patients missing isApproved
    const missingApproval = await User.countDocuments({
      role: 'patient',
      isApproved: { $exists: false }
    });

    if (missingApproval > 0) {
      console.log(`   ⚠️  WARNING: ${missingApproval} patients missing isApproved field`);
    } else {
      console.log('   ✅ All patients have isApproved field');
    }

    // Step 7: Statistics
    console.log('\n📊 Migration Statistics:');
    console.log('═══════════════════════════════════════════════════════');
    
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
      }),
      patientsWithNullIds: await User.countDocuments({ 
        role: 'patient',
        patientId: null
      }),
      patientsWithoutField: await User.countDocuments({ 
        role: 'patient',
        patientId: { $exists: false }
      })
    };

    console.log(`   Total Patients:         ${stats.totalPatients}`);
    console.log(`   Approved:               ${stats.approvedPatients}`);
    console.log(`   Rejected:               ${stats.rejectedPatients}`);
    console.log(`   Pending:                ${stats.pendingPatients}`);
    console.log(`   With Patient IDs:       ${stats.patientsWithIds}`);
    console.log(`   With null IDs:          ${stats.patientsWithNullIds}`);
    console.log(`   Missing patientId field: ${stats.patientsWithoutField}`);
    
    const approvalRate = stats.totalPatients > 0 
      ? ((stats.approvedPatients / stats.totalPatients) * 100).toFixed(1)
      : '0.0';
    console.log(`   Approval Rate:          ${approvalRate}%`);

    // Step 8: Sample data
    console.log('\n📋 Sample Patient Records:');
    console.log('═══════════════════════════════════════════════════════');
    
    const samplePending = await User.findOne({ 
      role: 'patient', 
      isApproved: false,
      isRejected: { $ne: true }
    }).select('email firstName lastName patientId isApproved');
    
    if (samplePending) {
      console.log('   ⏳ Pending Patient Sample:');
      console.log(`      Email:      ${samplePending.email}`);
      console.log(`      Name:       ${samplePending.firstName} ${samplePending.lastName}`);
      console.log(`      Patient ID: ${samplePending.patientId === null ? 'null (correct)' : samplePending.patientId}`);
      console.log(`      Approved:   ${samplePending.isApproved}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Migration completed successfully!\n');

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('🎉 All done! Your database is now properly configured.\n');
      console.log('Next steps:');
      console.log('1. You can now approve patients from your admin dashboard');
      console.log('2. Approved patients will automatically get unique Patient IDs');
      console.log('3. Restart your application\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default migrateDatabase;