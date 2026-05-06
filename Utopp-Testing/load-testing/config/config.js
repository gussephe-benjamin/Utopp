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
        // Global API envelope
        'http_req_duration{type:API}': ['p(95)<2000', 'p(99)<4000'],
        // Endpoint-level SLOs (more actionable than a single global metric)
        'http_req_duration{name:login,type:API}': ['p(95)<1200', 'p(99)<2000'],
        'http_req_duration{name:get_feed,type:API}': ['p(95)<1500', 'p(99)<2500'],
        'http_req_duration{name:get_users_me,type:API}': ['p(95)<800', 'p(99)<1500'],
        'http_req_duration{name:get_all_users,type:API}': ['p(95)<1200', 'p(99)<2200'],
        'http_req_duration{name:get_roles_me,type:API}': ['p(95)<600', 'p(99)<1200'],
        
        // Error rate must be less than 1%
        'http_req_failed{type:API}': ['rate<0.01'],
        'checks{name:login}': ['rate>0.99'],
        'checks{name:get_feed}': ['rate>0.99'],
        'checks{name:get_users_me}': ['rate>0.99'],
        'checks{name:get_all_users}': ['rate>0.99'],
        'checks{name:get_roles_me}': ['rate>0.99'],
        
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
