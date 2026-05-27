// ============================================================
// Load test (carga sostenida): VUs constantes durante un tiempo
// ============================================================

import { SharedArray } from 'k6/data';
import config from '../../config/config.js';
import { runAuthenticatedIteration } from '../common/api-flow.js';

const users = new SharedArray('users', function () {
    return JSON.parse(open('../../data/users.json'));
});

export const options = {
    vus: Number(config.test.vus) || 50,
    duration: config.test.duration,
    thresholds: config.thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
    console.log(
        `Load: ${options.vus} VUs, ${options.duration} → ${config.api.baseUrl}`,
    );
    return { start: new Date().toISOString() };
}

export default function () {
    const user = users[(__VU - 1) % users.length];
    runAuthenticatedIteration(config, user, { shortenThinkMs: false });
}

export function teardown(data) {
    console.log(`Load test end. Started: ${data.start}`);
}
