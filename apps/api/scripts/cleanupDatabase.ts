// Emergency Database Cleanup Script
// Run this FIRST to clean up the database state
// Usage: npx ts-node scripts/cleanupDatabase.ts

import * as dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectMongoDB } from '../src/lib/mongodb';

async function cleanupDatabase() {
  try {
    console.log('🧹 Emergency Database Cleanup Starting...\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const usersCollection = db.collection('users');

    // Step 1: List all current indexes
    console.log('1️⃣  Current Indexes:');
    const indexes = await usersCollection.indexes();
    console.log(`   Found ${indexes.length} total indexes\n`);
    
    indexes.forEach((idx, i) => {
      console.log(`   ${i + 1}. ${idx.name}`);
      console.log(`      Keys: ${JSON.stringify(idx.key)}`);
      console.log(`      Unique: ${idx.unique || false}`);
      console.log(`      Sparse: ${idx.sparse || false}\n`);
    });

    // Step 2: Drop ALL patientId indexes
    console.log('2️⃣  Dropping all patientId indexes...');
    const patientIdIndexes = indexes.filter(idx => idx.key.patientId);
    
    if (patientIdIndexes.length === 0) {
      console.log('   ℹ️  No patientId indexes found');
    } else {
      for (const idx of patientIdIndexes) {
        if (idx.name) {
          try {
            console.log(`   🔄 Dropping: ${idx.name}`);
            await usersCollection.dropIndex(idx.name);
            console.log(`   ✅ Dropped: ${idx.name}`);
          } catch (error: any) {
            console.log(`   ⚠️  Error dropping ${idx.name}: ${error.message}`);
          }
        }
      }
    }

    // Step 3: Check database state
    console.log('\n3️⃣  Checking database state...');
    
    const totalPatients = await usersCollection.countDocuments({ role: 'patient' });
    console.log(`   Total patients: ${totalPatients}`);
    
    const patientsWithNullId = await usersCollection.countDocuments({ 
      role: 'patient',
      patientId: null 
    });
    console.log(`   Patients with null patientId: ${patientsWithNullId}`);
    
    const patientsWithActualId = await usersCollection.countDocuments({ 
      role: 'patient',
      patientId: { $ne: null, $exists: true }
    });
    console.log(`   Patients with actual patientId: ${patientsWithActualId}`);
    
    const patientsWithoutField = await usersCollection.countDocuments({ 
      role: 'patient',
      patientId: { $exists: false }
    });
    console.log(`   Patients missing patientId field: ${patientsWithoutField}`);

    // Step 4: Sample problematic records
    if (patientsWithNullId > 1) {
      console.log('\n4️⃣  Sample records with null patientId:');
      const samples = await usersCollection.find({ 
        role: 'patient',
        patientId: null 
      }).limit(3).toArray();
      
      samples.forEach((sample, i) => {
        console.log(`   ${i + 1}. ${sample.email}`);
        console.log(`      Name: ${sample.firstName} ${sample.lastName}`);
        console.log(`      isApproved: ${sample.isApproved}`);
        console.log(`      patientId: ${sample.patientId}\n`);
      });
    }

    // Step 5: Verify indexes after cleanup
    console.log('5️⃣  Verifying cleanup...');
    const remainingIndexes = await usersCollection.indexes();
    const remainingPatientIdIndexes = remainingIndexes.filter(idx => idx.key.patientId);
    
    if (remainingPatientIdIndexes.length > 0) {
      console.log('   ⚠️  WARNING: PatientId indexes still exist:');
      remainingPatientIdIndexes.forEach(idx => {
        console.log(`      - ${idx.name} (sparse: ${idx.sparse}, unique: ${idx.unique})`);
      });
    } else {
      console.log('   ✅ All patientId indexes successfully removed');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Cleanup completed!\n');
    console.log('Next steps:');
    console.log('1. Make sure your User model does NOT have: userSchema.index({ patientId: 1 })');
    console.log('2. Restart your application to prevent Mongoose from recreating the index');
    console.log('3. Run the migration script: npx ts-node scripts/migrateDatabase.ts\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run cleanup
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log('🎉 Done!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default cleanupDatabase;