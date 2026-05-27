// ============================================================
// Flujo HTTP compartido: login + endpoints autenticados típicos
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

/** Contadores por punto del flujo para el resumen post-test (opcional). */
export const failuresByStage = new Counter('utopp_failures_by_stage');

function recordFailure(stage /* string */) {
    failuresByStage.add(1, { stage: stage });
}

/**
 * Ejecuta un ciclo de usuario: POST login + GET feed, users/me, all-users, roles/me.
 *
 * @param {object} cfg - config exportado desde config/config.js
 * @param {{ email: string, password: string }} user - credencial de este VU / iteración
 * @param {object} opts - opciones opcionales: { shortenThinkMs: boolean }
 */
export function runAuthenticatedIteration(cfg, user, opts = {}) {
    const shortThink =
        opts.shortenThinkMs === true
            ? () => sleep(Math.random() * 0.2)
            : () =>
                  sleep(Math.random() * (cfg.thinkTime.max - cfg.thinkTime.min) + cfg.thinkTime.min);

    const base = cfg.api.baseUrl;
    const tagApi = { type: 'API' };

    const loginPayload = JSON.stringify({
        email: user.email,
        password: user.password,
    });

    const loginParams = {
        headers: { 'Content-Type': 'application/json' },
        tags: { ...tagApi, name: 'login' },
        timeout: cfg.api.timeout,
    };

    const loginResponse = http.post(`${base}${cfg.auth.loginEndpoint}`, loginPayload, loginParams);

    const loginOk = check(
        loginResponse,
        {
            'login status 200': (r) => r.status === 200,
            has_token: (r) => {
                if (r.status !== 200 || !r.body || r.body.length === 0) {
                    return false;
                }
                try {
                    return r.json('access_token') !== undefined;
                } catch (_) {
                    return false;
                }
            },
        },
        { name: 'login', type: 'API' },
    );

    if (!loginOk) {
        recordFailure('login');
        return;
    }

    let accessToken;
    try {
        accessToken = loginResponse.json('access_token');
    } catch (_) {
        recordFailure('login_json');
        return;
    }

    const authHeader = `${cfg.auth.tokenPrefix}${accessToken}`;
    const authParams = {
        headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
        },
        tags: tagApi,
        timeout: cfg.api.timeout,
    };

    const rFeed = http.get(`${base}${cfg.endpoints.feed}`, {
        ...authParams,
        tags: { ...tagApi, name: 'get_feed' },
    });
    if (
        !check(
            rFeed,
            {
                feed_200_o_401: (r) => r.status === 200 || r.status === 401,
                feed_items_si_200: (r) =>
                    r.status !== 200 ||
                    (r.json && typeof r.json('items') !== 'undefined'),
            },
            { name: 'get_feed', type: 'API' },
        )
    ) {
        recordFailure('get_feed');
    }

    shortThink();

    const rMe = http.get(`${base}${cfg.endpoints.usersMe}`, {
        ...authParams,
        tags: { ...tagApi, name: 'get_users_me' },
    });
    if (
        !check(
            rMe,
            {
                users_me_200_o_401: (r) => r.status === 200 || r.status === 401,
            },
            { name: 'get_users_me', type: 'API' },
        )
    ) {
        recordFailure('get_users_me');
    }

    shortThink();

    const rAll = http.get(`${base}${cfg.endpoints.allUsers}`, {
        ...authParams,
        tags: { ...tagApi, name: 'get_all_users' },
    });
    if (
        !check(
            rAll,
            {
                all_users_200: (r) => r.status === 200,
                all_users_array: (r) => r.status !== 200 || Array.isArray(r.json()),
            },
            { name: 'get_all_users', type: 'API' },
        )
    ) {
        recordFailure('get_all_users');
    }

    shortThink();

    const rRoles = http.get(`${base}${cfg.endpoints.rolesMe}`, {
        ...authParams,
        tags: { ...tagApi, name: 'get_roles_me' },
    });
    if (
        !check(
            rRoles,
            {
                roles_me_200: (r) => r.status === 200,
                roles_me_array: (r) =>
                    r.status !== 200 || Array.isArray(r.json()),
            },
            { name: 'get_roles_me', type: 'API' },
        )
    ) {
        recordFailure('get_roles_me');
    }

    shortThink();
}
