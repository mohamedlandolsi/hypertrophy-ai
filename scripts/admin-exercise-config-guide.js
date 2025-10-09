// Quick reference guide for configuring exercises after migration
// This script provides examples and templates for admin configuration

console.log('=== Exercise Configuration Guide ===\n');

console.log('EXERCISE TYPES:\n');
console.log('1. COMPOUND - Multi-joint exercises (2+ joints moving)');
console.log('   Examples: Bench Press, Squat, Deadlift, Row, Pull-up');
console.log('   Target: Multiple large muscle groups\n');

console.log('2. ISOLATION - Single-joint exercises (1 joint moving)');
console.log('   Examples: Bicep Curl, Leg Extension, Chest Fly, Lateral Raise');
console.log('   Target: Specific muscle group\n');

console.log('3. UNILATERAL - One-sided exercises');
console.log('   Examples: Bulgarian Split Squat, Single-leg Press, One-arm Row');
console.log('   Target: Balance and symmetry\n');

console.log('═══════════════════════════════════════════════════════════\n');

console.log('VOLUME CONTRIBUTION TEMPLATES:\n');

console.log('CHEST EXERCISES:\n');
console.log('  Bench Press (COMPOUND):');
console.log('    {"CHEST": 1.0, "FRONT_DELTS": 0.5, "TRICEPS": 0.5}\n');

console.log('  Incline Bench Press (COMPOUND):');
console.log('    {"CHEST": 1.0, "FRONT_DELTS": 0.75, "TRICEPS": 0.5}\n');

console.log('  Chest Fly Machine (ISOLATION):');
console.log('    {"CHEST": 1.0}\n');

console.log('LEG EXERCISES:\n');
console.log('  Squat (COMPOUND):');
console.log('    {"QUADRICEPS": 1.0, "GLUTES": 0.75, "HAMSTRINGS": 0.5}\n');

console.log('  Front Squat (COMPOUND):');
console.log('    {"QUADRICEPS": 1.0, "GLUTES": 0.5, "ABS": 0.5}\n');

console.log('  Romanian Deadlift (COMPOUND):');
console.log('    {"HAMSTRINGS": 1.0, "GLUTES": 0.75, "LATS": 0.25, "TRAPEZIUS_RHOMBOIDS": 0.25}\n');

console.log('  Leg Extension (ISOLATION):');
console.log('    {"QUADRICEPS": 1.0}\n');

console.log('  Bulgarian Split Squat (UNILATERAL):');
console.log('    {"QUADRICEPS": 1.0, "GLUTES": 0.75, "HAMSTRINGS": 0.5}\n');

console.log('  Leg Press (COMPOUND):');
console.log('    {"QUADRICEPS": 1.0, "GLUTES": 0.75, "HAMSTRINGS": 0.5}\n');

console.log('  Leg Curl (ISOLATION):');
console.log('    {"HAMSTRINGS": 1.0}\n');

console.log('BACK EXERCISES:\n');
console.log('  Barbell Row (COMPOUND):');
console.log('    {"LATS": 1.0, "TRAPEZIUS_RHOMBOIDS": 0.75, "REAR_DELTS": 0.5, "ELBOW_FLEXORS": 0.5}\n');

console.log('  Deadlift (COMPOUND):');
console.log('    {"LATS": 1.0, "TRAPEZIUS_RHOMBOIDS": 0.75, "GLUTES": 0.75, "HAMSTRINGS": 0.75}\n');

console.log('  Lat Pulldown (COMPOUND):');
console.log('    {"LATS": 1.0, "TRAPEZIUS_RHOMBOIDS": 0.5, "ELBOW_FLEXORS": 0.5}\n');

console.log('  Chest Supported Row (COMPOUND):');
console.log('    {"LATS": 1.0, "TRAPEZIUS_RHOMBOIDS": 0.75, "REAR_DELTS": 0.5}\n');

console.log('SHOULDER EXERCISES:\n');
console.log('  Overhead Press (COMPOUND):');
console.log('    {"FRONT_DELTS": 1.0, "SIDE_DELTS": 0.5, "TRICEPS": 0.5}\n');

console.log('  Lateral Raise (ISOLATION):');
console.log('    {"SIDE_DELTS": 1.0}\n');

console.log('  Face Pull (ISOLATION):');
console.log('    {"REAR_DELTS": 1.0, "TRAPEZIUS_RHOMBOIDS": 0.5}\n');

console.log('ARM EXERCISES:\n');
console.log('  Bicep Curl (ISOLATION):');
console.log('    {"ELBOW_FLEXORS": 1.0}\n');

console.log('  Tricep Extension (ISOLATION):');
console.log('    {"TRICEPS": 1.0}\n');

console.log('  Close-grip Bench Press (COMPOUND):');
console.log('    {"TRICEPS": 1.0, "CHEST": 0.5, "FRONT_DELTS": 0.5}\n');

console.log('═══════════════════════════════════════════════════════════\n');

console.log('AVAILABLE MUSCLE GROUPS:\n');
const muscleGroups = [
  'CHEST',
  'LATS',
  'TRAPEZIUS_RHOMBOIDS',
  'FRONT_DELTS',
  'SIDE_DELTS',
  'REAR_DELTS',
  'ELBOW_FLEXORS',
  'TRICEPS',
  'WRIST_FLEXORS',
  'WRIST_EXTENSORS',
  'ABS',
  'GLUTES',
  'QUADRICEPS',
  'HAMSTRINGS',
  'ADDUCTORS',
  'CALVES'
];

muscleGroups.forEach((muscle, i) => {
  if (i % 3 === 0) console.log('');
  process.stdout.write(`  ${muscle.padEnd(16)}`);
});
console.log('\n');

console.log('═══════════════════════════════════════════════════════════\n');

console.log('CONTRIBUTION LEVEL GUIDELINES:\n');
console.log('  1.0  = Primary target (direct, main working muscle)');
console.log('  0.75 = Strong secondary (heavily involved)');
console.log('  0.5  = Standard secondary (moderately involved)');
console.log('  0.25 = Light secondary/stabilizer (minimal contribution)');
console.log('  0    = Not targeted (no contribution)\n');

console.log('═══════════════════════════════════════════════════════════\n');

console.log('CONFIGURATION CHECKLIST:\n');
console.log('  1. Open admin panel: http://localhost:3000/admin/exercises');
console.log('  2. Edit each exercise');
console.log('  3. Set exercise type (COMPOUND/ISOLATION/UNILATERAL)');
console.log('  4. Add volume contributions JSON');
console.log('  5. Save changes');
console.log('  6. Verify with test script: node test-exercise-type-system.js\n');

console.log('═══════════════════════════════════════════════════════════\n');

console.log('TIPS:\n');
console.log('  • Start with APPROVED exercises first (41 exercises)');
console.log('  • Most machines = ISOLATION or COMPOUND');
console.log('  • Barbells/dumbbells = Usually COMPOUND');
console.log('  • Cable exercises = Can be either');
console.log('  • Single-arm/leg = UNILATERAL');
console.log('  • When in doubt, mark as COMPOUND\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('Ready to configure exercises!');
console.log('Run this script anytime for quick reference: node admin-exercise-config-guide.js\n');
