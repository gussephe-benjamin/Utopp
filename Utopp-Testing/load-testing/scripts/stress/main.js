// ============================================================
// Stress test: incremento progresivo de VUs (rampa) hasta observar
// saturación o fallos. Umbrales más laxos que en load.
// ============================================================

import { SharedArray } from 'k6/data';
import config from '../../config/config.js';
import { runAuthenticatedIteration } from '../common/api-flow.js';

const users = new SharedArray('users', function () {
    return JSON.parse(open('../../data/users.json'));
});

const maxTarget = Number(__ENV.STRESS_MAX_VUS || 250);

/**
 * Lista de niveles objetivo (VUs) ascendentes.
 * STRESS_CUSTOM_STEPS: "50,200,500,1000" (solo números, sin espacios raros)
 * Para max altos (>120) usa rampa espaciada (≈ ×1.35) para no generar horas de planchas.
 */
function buildVuMilestones() {
    const custom = __ENV.STRESS_CUSTOM_STEPS;
    if (custom && custom.trim()) {
        const vals = custom
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => n > 0 && Number.isFinite(n));
        vals.sort((a, b) => a - b);
        const last = vals[vals.length - 1];
        if (!vals.includes(maxTarget) && maxTarget > last) {
            vals.push(maxTarget);
            vals.sort((a, b) => a - b);
        }
        return [...new Set(vals)]
            .filter((s) => s <= maxTarget)
            .sort((a, b) => a - b);
    }

    const fine = [
        10, 25, 50, 75, 100, 125, 150, 175, 200, maxTarget,
    ];
    if (maxTarget <= 120) {
        const uniq = [...new Set(fine.filter((s) => s <= maxTarget))];
        if (!uniq.includes(maxTarget)) {
            uniq.push(maxTarget);
        }
        return [...new Set(uniq)].sort((a, b) => a - b);
    }

    const out = [];
    let n = Math.min(50, Math.max(15, Math.floor(maxTarget / 40)));
    n = Math.max(15, Math.min(maxTarget, n));
    out.push(n);
    const capSteps = Number(__ENV.STRESS_COARSE_STEP_CAP || 22);
    while (n < maxTarget && out.length < capSteps) {
        const next = Math.min(
            maxTarget,
            Math.max(n + 25, Math.ceil(n * 1.35)),
        );
        if (next <= n) break;
        n = next;
        out.push(n);
    }
    if (!out.includes(maxTarget)) {
        out.push(maxTarget);
    }
    return [...new Set(out)].sort((a, b) => a - b);
}

function rampSeconds(prev, target) {
    const delta = target - prev;
    if (maxTarget <= 120) {
        return Math.floor(
            Math.max(15, Math.min(90, delta / 2 + 15)),
        );
    }
    // Rampas grandes: más tiempo proporcional pero con tope (~2–3 min)
    return Math.floor(
        Math.max(30, Math.min(180, delta / 5 + 20)),
    );
}

function buildStages(vuLevels) {
    const uniq = vuLevels;
    const plateauSec = Number(__ENV.STRESS_PLATEAU || 45);

    const stages = [];
    for (let i = 0; i < uniq.length; i++) {
        const prev = i === 0 ? 0 : uniq[i - 1];
        const target = uniq[i];
        stages.push({
            duration: `${rampSeconds(prev, target)}s`,
            target,
        });
        stages.push({
            duration: `${plateauSec}s`,
            target,
        });
    }
    stages.push({ duration: '45s', target: 0 });
    return stages;
}

const vuMilestones = buildVuMilestones();
const failRateMax =
    __ENV.STRESS_FAIL_RATE_MAX !== undefined
        ? Number(__ENV.STRESS_FAIL_RATE_MAX)
        : maxTarget >= 500
          ? 0.9
          : 0.35;

export const options = {
    stages: buildStages(vuMilestones),
    thresholds: {
        // Con cientos/miles de VUs es normal superar latencias; el umbral de error
        // se relaja (o STRESS_FAIL_RATE_MAX) para terminar la corrida y ver métricas.
        'http_req_duration{type:API}': ['p(95)<120000', 'p(99)<120000'],
        'http_req_failed{type:API}': [`rate<${failRateMax}`],
    },
};

export function setup() {
    const stagesCount = vuMilestones.length * 2 + 1;
    console.log(
        JSON.stringify({
            kind: 'stress',
            baseUrl: config.api.baseUrl,
            maxVUs: maxTarget,
            vuMilestones,
            stageCountApprox: stagesCount,
            failRateAllowed: failRateMax,
            hint: `${vuMilestones.length} niveles hasta ${maxTarget} VUs; k6 reusará usuarios del JSON.`,
        }),
    );
    return {};
}

export default function () {
    const user = users[(__VU - 1) % users.length];
    runAuthenticatedIteration(config, user, { shortenThinkMs: true });
}
