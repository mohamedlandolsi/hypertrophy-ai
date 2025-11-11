/**
 * Performance Test Configuration
 * 
 * Defines thresholds and settings for performance testing
 */

export const PERFORMANCE_THRESHOLDS = {
  // Page Load Performance (milliseconds)
  PAGE_LOAD: {
    PROGRAMS_LIST_100: 2000,      // Programs page with 100 programs
    WORKOUT_EDITOR_50: 1500,      // Workout editor with 50 exercises
    TEMPLATE_IMPORT_50: 3000,     // Import template with 50+ exercises
  },

  // API Response Times (milliseconds)
  API: {
    PROGRAMS_LIST: 500,            // GET /api/programs
    WORKOUTS_QUERY: 500,           // GET /api/programs/[id]/workouts
    TEMPLATE_DETAILS: 300,         // GET /api/programs/templates/[id]
    TEMPLATE_IMPORT: 2000,         // POST /api/programs/[id]/import-template
  },

  // Database Query Performance (milliseconds)
  DATABASE: {
    PROGRAMS_FETCH: 200,           // Fetch user programs
    WORKOUTS_WITH_EXERCISES: 300,  // Fetch workouts with full exercise data
    TEMPLATE_WITH_WORKOUTS: 250,   // Fetch template with all workouts
  },

  // Rendering Performance
  RENDERING: {
    MAX_RENDER_TIME: 16,           // 60 FPS = 16.67ms per frame
    MAX_RERENDER_COUNT: 3,         // Maximum acceptable re-renders
    MAX_INITIAL_BUNDLE_SIZE: 250,  // KB for initial JS bundle
  },

  // Memory Performance
  MEMORY: {
    MAX_HEAP_INCREASE: 50,         // MB - max heap increase during operations
    MAX_DOM_NODES: 1500,           // Maximum DOM nodes for performance
  },

  // Lighthouse Scores (0-100)
  LIGHTHOUSE: {
    PERFORMANCE: 90,
    ACCESSIBILITY: 95,
    BEST_PRACTICES: 90,
    SEO: 90,
    FIRST_CONTENTFUL_PAINT: 1500,  // ms
    LARGEST_CONTENTFUL_PAINT: 2500, // ms
    TIME_TO_INTERACTIVE: 3000,      // ms
    CUMULATIVE_LAYOUT_SHIFT: 0.1,   // score
  },
};

export const TEST_DATA_SIZES = {
  PROGRAMS: {
    SMALL: 10,
    MEDIUM: 50,
    LARGE: 100,
    XLARGE: 200,
  },
  EXERCISES: {
    SMALL: 10,
    MEDIUM: 25,
    LARGE: 50,
    XLARGE: 100,
  },
  WORKOUTS: {
    SMALL: 3,
    MEDIUM: 6,
    LARGE: 12,
  },
};

export const PERFORMANCE_TEST_CONFIG = {
  // Number of iterations for averaging results
  ITERATIONS: 5,
  
  // Warmup runs before actual measurement
  WARMUP_RUNS: 2,
  
  // Enable detailed profiling output
  DETAILED_PROFILING: process.env.DETAILED_PROFILING === 'true',
  
  // Enable memory profiling
  MEMORY_PROFILING: process.env.MEMORY_PROFILING === 'true',
  
  // Enable screenshot on failure
  SCREENSHOT_ON_FAILURE: true,
  
  // Test timeout (milliseconds)
  TEST_TIMEOUT: 60000,
};

export const OPTIMIZATION_FLAGS = {
  // Features to test
  PAGINATION: true,
  LAZY_LOADING: true,
  MEMOIZATION: true,
  VIRTUALIZATION: true,
  CACHING: true,
  CODE_SPLITTING: true,
  IMAGE_OPTIMIZATION: true,
};
