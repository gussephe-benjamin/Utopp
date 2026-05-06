// ============================================================
// Load Testing Configuration
// ============================================================
// This file contains all configuration parameters for load testing.
// Modify these values to adjust test behavior without changing scripts.

export const config = {
    // API Configuration
    api: {
        baseUrl: __ENV.API_URL || 'http://localhost:8000',
        timeout: '30s',
    },

    // Test Parameters
    test: {
        // Number of virtual users (concurrent users)
        vus: __ENV.VUS || 50,
        
        // Duration of the test
        duration: __ENV.DURATION || '30s',
        
        // Stages configuration (for ramping up/down)
        // Uncomment to use staged load testing
        // stages: [
        //     { duration: '10s', target: 10 },  // Ramp up to 10 VUs
        //     { duration: '20s', target: 50 },  // Ramp up to 50 VUs
        //     { duration: '30s', target: 50 },  // Stay at 50 VUs
        //     { duration: '10s', target: 0 },   // Ramp down to 0 VUs
        // ],
    },

    // Thresholds - Performance criteria
    // If any threshold is breached, the test will fail
    thresholds: {
        // Una sola clave métrica: varias condiciones (p95 y p99 en ms)
        'http_req_duration{type:API}': ['p(95)<500', 'p(99)<1000'],
        
        // Error rate must be less than 1%
        'http_req_failed{type:API}': ['rate<0.01'],
        
        // Requests per second should be at least 10
        'http_reqs{type:API}': ['rate>=10'],
    },

    // Endpoints to test
    endpoints: {
        feed: '/feed',
        usersMe: '/users/me',
        allUsers: '/users/all-users',
        rolesMe: '/roles/me',
    },

    // Think time configuration
    // Pauses between requests to simulate realistic user behavior
    thinkTime: {
        min: 1,  // Minimum pause in seconds
        max: 3,  // Maximum pause in seconds
    },

    // Authentication configuration
    auth: {
        loginEndpoint: '/auth/login',
        tokenHeader: 'Authorization',
        tokenPrefix: 'Bearer ',
    },
};

// Export configuration for use in test scripts
export default config;
