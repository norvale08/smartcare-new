// ========================================
// FINAL NUCLEAR FIX
// Problem: Sparse index is NOT working - it's rejecting multiple nulls
// Solution: Don't use patientId field AT ALL for unapproved patients
// ========================================

import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectMongoDB } from '../src/lib/mongodb';

async function finalFix() {
  try {
    console.log('💥 FINAL NUCLEAR FIX - Starting...\n');
    console.log('═══════════════════════════════════════════════════════\n');

    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not available');
    
    const usersCollection = db.collection('users');

    // Step 1: Drop ALL patientId indexes
    console.log('1️⃣  Dropping ALL patientId indexes...');
    const indexes = await usersCollection.indexes();
    const patientIdIndexes = indexes.filter(idx => idx.key.patientId);
    
    for (const idx of patientIdIndexes) {
      if (idx.name) {
        console.log(`   🔄 Dropping: ${idx.name}`);
        await usersCollection.dropIndex(idx.name);
        console.log(`   ✅ Dropped: ${idx.name}`);
      }
    }

    // Step 2: REMOVE patientId field from ALL unapproved patients
    console.log('\n2️⃣  Removing patientId from unapproved patients...');
    const result1 = await usersCollection.updateMany(
      { 
        role: 'patient',
        isApproved: { $ne: true }
      },
      { $unset: { patientId: "" } }
    );
    console.log(`   ✅ Removed patientId from ${result1.modifiedCount} unapproved patients`);

    // Step 3: Keep patientId ONLY for approved patients
    console.log('\n3️⃣  Verifying approved patients have IDs...');
    const approvedWithIds = await usersCollection.countDocuments({
      role: 'patient',
      isApproved: true,
      patientId: { $exists: true, $ne: null }
    });
    console.log(`   ✅ ${approvedWithIds} approved patients have Patient IDs`);

    // Step 4: Create index ONLY on existing (non-null) patientId values
    console.log('\n4️⃣  Creating TRUE sparse unique index...');
    await usersCollection.createIndex(
      { patientId: 1 },
      { 
        unique: true, 
        sparse: true,
        name: 'patientId_sparse_unique_v2'
      }
    );
    console.log('   ✅ Created sparse unique index: patientId_sparse_unique_v2');

    // Step 5: Verify the index
    console.log('\n5️⃣  Verifying index properties...');
    const newIndexes = await usersCollection.indexes();
    const newPatientIdIndex = newIndexes.find(idx => idx.name === 'patientId_sparse_unique_v2');
    
    if (newPatientIdIndex) {
      console.log(`   📋 Index: ${newPatientIdIndex.name}`);
      console.log(`   📋 Sparse: ${newPatientIdIndex.sparse}`);
      console.log(`   📋 Unique: ${newPatientIdIndex.unique}`);
      
      if (newPatientIdIndex.sparse === true) {
        console.log('   ✅ Index is TRULY sparse!');
      } else {
        console.log('   ⚠️  WARNING: Index is NOT sparse!');
      }
    }

    // Step 6: Test creating a new patient (should work now)
    console.log('\n6️⃣  Testing patient creation...');
    try {
      const testPatient = {
        firstName: 'Test',
        lastName: 'Patient',
        email: `test_${Date.now()}@test.com`,
        phoneNumber: 1234567890,
        password: 'testpass',
        role: 'patient',
        isApproved: false,
        isRejected: false
        // NO patientId field at all
      };
      
      const result = await usersCollection.insertOne(testPatient);
      console.log(`   ✅ Test patient created: ${testPatient.email}`);
      
      // Clean up test patient
      await usersCollection.deleteOne({ _id: result.insertedId });
      console.log('   ✅ Test patient removed');
    } catch (error: any) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }

    // Step 7: Final statistics
    console.log('\n📊 Final Statistics:');
    console.log('═══════════════════════════════════════════════════════');
    
    const stats = {
      totalPatients: await usersCollection.countDocuments({ role: 'patient' }),
      approvedPatients: await usersCollection.countDocuments({ role: 'patient', isApproved: true }),
      pendingPatients: await usersCollection.countDocuments({ 
        role: 'patient', 
        isApproved: { $ne: true },
        isRejected: { $ne: true }
      }),
      patientsWithIds: await usersCollection.countDocuments({ 
        role: 'patient', 
        patientId: { $exists: true, $ne: null }
      }),
      patientsWithoutIds: await usersCollection.countDocuments({ 
        role: 'patient',
        patientId: { $exists: false }
      })
    };

    console.log(`   Total Patients:           ${stats.totalPatients}`);
    console.log(`   Approved (should have ID): ${stats.approvedPatients}`);
    console.log(`   Pending (no ID):          ${stats.pendingPatients}`);
    console.log(`   With Patient IDs:         ${stats.patientsWithIds}`);
    console.log(`   Without patientId field:  ${stats.patientsWithoutIds}`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Fix completed!\n');
    console.log('IMPORTANT: Update your User schema to NOT include patientId field by default');
    console.log('The field should ONLY be added when patient is approved.\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  finalFix()
    .then(() => {
      console.log('🎉 Done! Try creating a new patient now.\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default finalFix;