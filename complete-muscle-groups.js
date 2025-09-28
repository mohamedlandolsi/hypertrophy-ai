/**
 * Complete Exercise Volume Tracking Muscle Groups
 * 
 * This document lists all available muscle groups for volume tracking in the exercise database.
 * Each muscle can be assigned a volume contribution of:
 * - 1.0 (Direct involvement)
 * - 0.5 (Indirect involvement) 
 * - 0.0 (No involvement)
 */

const COMPLETE_VOLUME_MUSCLES = {
  // ===============================
  // CHEST MUSCLES
  // ===============================
  chest: [
    'UPPER_CHEST',     // Upper pectoralis major (clavicular head)
    'MIDDLE_CHEST',    // Middle pectoralis major (sternal head)
    'LOWER_CHEST',     // Lower pectoralis major (costal head)
  ],

  // ===============================
  // ARM MUSCLES - BICEPS & RELATED
  // ===============================
  bicepsGroup: [
    'BICEPS',          // Biceps brachii (long and short head)
    'BRACHIALIS',      // Brachialis (underneath biceps)
    'BRACHIORADIALIS', // Brachioradialis (forearm muscle, elbow flexor)
  ],

  // ===============================
  // ARM MUSCLES - TRICEPS
  // ===============================
  tricepsGroup: [
    'TRICEPS_LONG_HEAD',    // Long head (medial border of scapula)
    'TRICEPS_MEDIAL_HEAD',  // Medial head (posterior humerus)
    'TRICEPS_LATERAL_HEAD', // Lateral head (posterior humerus)
  ],

  // ===============================
  // SHOULDER MUSCLES
  // ===============================
  shoulders: [
    'FRONT_DELTS',     // Anterior deltoid
    'SIDE_DELTS',      // Lateral/middle deltoid
    'REAR_DELTS',      // Posterior deltoid
  ],

  // ===============================
  // FOREARM MUSCLES
  // ===============================
  forearms: [
    'WRIST_FLEXORS',   // Flexor group (palm side)
    'WRIST_EXTENSORS', // Extensor group (back of hand side)
  ],

  // ===============================
  // BACK MUSCLES - LATS
  // ===============================
  latissimusGroup: [
    'UPPER_LATS',      // Upper portion of latissimus dorsi
    'MIDDLE_LATS',     // Middle portion of latissimus dorsi
    'LOWER_LATS',      // Lower portion of latissimus dorsi
  ],

  // ===============================
  // BACK MUSCLES - OTHER
  // ===============================
  backOther: [
    'TRAPEZIUS',       // Trapezius (upper, middle, lower)
    'RHOMBOIDS',       // Rhomboid major and minor
    'ERECTOR_SPINAE',  // Erector spinae group (lower back)
  ],

  // ===============================
  // GLUTE MUSCLES
  // ===============================
  glutes: [
    'GLUTEUS_MAXIMUS',  // Largest glute muscle
    'GLUTEUS_MEDIUS',   // Hip abduction and stabilization
    'GLUTEUS_MINIMUS',  // Hip abduction and internal rotation
  ],

  // ===============================
  // HIP ADDUCTOR MUSCLES
  // ===============================
  adductors: [
    'ADDUCTOR_MAGNUS',  // Largest adductor muscle
    'OTHER_ADDUCTORS',  // Adductor longus, brevis, pectineus, gracilis
  ],

  // ===============================
  // QUADRICEPS MUSCLES
  // ===============================
  quadriceps: [
    'RECTUS_FEMORIS',    // Rectus femoris (crosses hip and knee)
    'VASTUS_LATERALIS',  // Vastus lateralis (outer thigh)
    'VASTUS_MEDIALIS',   // Vastus medialis (inner thigh)
    'VASTUS_INTERMEDIUS', // Vastus intermedius (deep, under rectus femoris)
  ],

  // ===============================
  // POSTERIOR CHAIN
  // ===============================
  posteriorChain: [
    'HAMSTRINGS',       // Biceps femoris, semitendinosus, semimembranosus
  ],

  // ===============================
  // LOWER LEG MUSCLES
  // ===============================
  lowerLeg: [
    'CALVES',           // Gastrocnemius and soleus
    'TIBIALIS_ANTERIOR', // Shin muscles (dorsiflexors)
  ],

  // ===============================
  // CORE MUSCLES
  // ===============================
  core: [
    'ABS',              // Rectus abdominis
    'OBLIQUES',         // Internal and external obliques
  ],

  // ===============================
  // STABILIZING & ACCESSORY MUSCLES
  // ===============================
  stabilizers: [
    'HIP_FLEXORS',      // Hip flexor group
    'SERRATUS_ANTERIOR', // Serratus anterior (protraction/upward rotation of scapula)
    'PECTORALIS_MINOR', // Pectoralis minor (scapular depression/protraction)
  ],

  // ===============================
  // ROTATOR CUFF MUSCLES
  // ===============================
  rotatorCuff: [
    'TERES_MAJOR',      // Teres major ("lat's little helper")
    'TERES_MINOR',      // Teres minor (external rotation)
    'INFRASPINATUS',    // Infraspinatus (external rotation)
    'SUPRASPINATUS',    // Supraspinatus (abduction initiation)
    'SUBSCAPULARIS',    // Subscapularis (internal rotation)
  ]
};

// Total muscle count
const totalMuscles = Object.values(COMPLETE_VOLUME_MUSCLES).flat().length;

console.log('🏋️‍♂️ COMPLETE EXERCISE VOLUME TRACKING SYSTEM');
console.log('='.repeat(50));
console.log(`📊 Total Available Muscles: ${totalMuscles}`);
console.log('');

// Display all muscle groups
Object.entries(COMPLETE_VOLUME_MUSCLES).forEach(([groupName, muscles]) => {
  const groupTitle = groupName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  console.log(`📍 ${groupTitle.toUpperCase()} (${muscles.length} muscles):`);
  muscles.forEach(muscle => {
    const displayName = muscle.split('_').map(word => 
      word.toLowerCase().replace(/^./, str => str.toUpperCase())
    ).join(' ');
    console.log(`   • ${muscle} - ${displayName}`);
  });
  console.log('');
});

console.log('✨ USAGE EXAMPLES:');
console.log('');
console.log('🎯 Bench Press Example:');
console.log('   MIDDLE_CHEST: 1.0 (Direct)');
console.log('   FRONT_DELTS: 0.5 (Indirect)');
console.log('   TRICEPS_LATERAL_HEAD: 0.5 (Indirect)');
console.log('   TRICEPS_MEDIAL_HEAD: 0.5 (Indirect)');
console.log('');
console.log('🎯 Barbell Row Example:');
console.log('   MIDDLE_LATS: 1.0 (Direct)');
console.log('   UPPER_LATS: 0.5 (Indirect)');
console.log('   RHOMBOIDS: 0.5 (Indirect)');
console.log('   TRAPEZIUS: 0.5 (Indirect)');
console.log('   REAR_DELTS: 0.5 (Indirect)');
console.log('   BICEPS: 0.5 (Indirect)');
console.log('');
console.log('🎯 Bulgarian Split Squat Example:');
console.log('   RECTUS_FEMORIS: 1.0 (Direct)');
console.log('   VASTUS_LATERALIS: 1.0 (Direct)');
console.log('   VASTUS_MEDIALIS: 1.0 (Direct)');
console.log('   VASTUS_INTERMEDIUS: 1.0 (Direct)');
console.log('   GLUTEUS_MAXIMUS: 1.0 (Direct)');
console.log('   GLUTEUS_MEDIUS: 0.5 (Stabilizer)');
console.log('   HAMSTRINGS: 0.5 (Indirect)');
console.log('   ABS: 0.5 (Stabilizer)');
console.log('');
console.log('🚀 This comprehensive system allows for precise muscle volume tracking');
console.log('   enabling optimal hypertrophy program design and AI recommendations!');

module.exports = COMPLETE_VOLUME_MUSCLES;