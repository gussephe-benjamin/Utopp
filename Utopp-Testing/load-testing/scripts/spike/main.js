// ============================================================
// Spike test: nivel bajo → pico brusco de VUs → sostenimiento → bajada
// ============================================================

import { SharedArray } from 'k6/data';
import config from '../../config/config.js';
import { runAuthenticatedIteration } from '../common/api-flow.js';

const users = new SharedArray('users', function () {
    return JSON.parse(open('../../data/users.json'));
});

const baseline = Number(__ENV.SPIKE_BASELINE_VUS || 15);
const peak = Number(__ENV.SPIKE_PEAK_VUS || 180);
const rampUp = __ENV.SPIKE_RAMP_UP || '15s';
const holdPeak = __ENV.SPIKE_HOLD || '45s';
const rampDown = __ENV.SPIKE_RAMP_DOWN || '45s';

export const options = {
    stages: [
        { duration: '30s', target: baseline },
        { duration: rampUp, target: peak },
        { duration: holdPeak, target: peak },
        { duration: rampDown, target: baseline },
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        'http_req_duration{type:API}': ['p(95)<25000'],
        // Picos pueden generar colas temporales
        'http_req_failed{type:API}': ['rate<0.40'],
    },
    summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
    console.log(
        JSON.stringify({
            kind: 'spike',
            baseUrl: config.api.baseUrl,
            baseline,
            peak,
            stages: options.stages,
        }),
    );
    return {};
}

export default function () {
    const user = users[(__VU - 1) % users.length];
    runAuthenticatedIteration(config, user, { shortenThinkMs: true });
}
