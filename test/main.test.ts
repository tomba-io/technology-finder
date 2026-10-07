// End-to-end tests: run the Actor against a mock Tomba API.
import assert from 'node:assert/strict';
import { after, afterEach, describe, it } from 'node:test';

import type { MockHandler, MockServer } from './helpers.js';
import { removeStorage, runActor, startMockTomba, totalCharges } from './helpers.js';

const TECHS = [
    {
        slug: 'react',
        name: 'React',
        icon: 'React.svg',
        website: 'https://react.dev',
        description: 'A JavaScript library for building user interfaces.',
        categories: [
            { id: 12, slug: 'javascript-frameworks', name: 'JavaScript frameworks' },
            { id: 59, slug: 'javascript-libraries', name: 'JavaScript libraries' },
        ],
    },
    {
        slug: 'nginx',
        name: 'Nginx',
        icon: 'Nginx.svg',
        website: 'https://nginx.org',
        categories: [{ id: 22, slug: 'web-servers', name: 'Web servers' }],
    },
];

/** Default Tomba behaviour: known domains return technologies, everything else returns no data. */
const tomba: MockHandler = (req) => {
    assert.equal(req.path, '/technology');
    if (req.query.domain === 'empty.com') return { body: { data: [] } };
    if (req.query.domain === 'invalid.com') return { status: 422, body: { errors: { message: 'Invalid domain' } } };
    if (req.query.domain === 'html.com') return { raw: '<html>Bad gateway</html>' };
    return { body: { domain: req.query.domain, data: TECHS } };
};

const servers: MockServer[] = [];
const dirs: string[] = [];

async function mock(handler: MockHandler = tomba): Promise<MockServer> {
    const server = await startMockTomba(handler);
    servers.push(server);
    return server;
}

async function run(...args: Parameters<typeof runActor>) {
    const result = await runActor(...args);
    dirs.push(result.storageDir);
    return result;
}

afterEach(async () => {
    await Promise.all(servers.splice(0).map(async (s) => s.close()));
});

after(async () => {
    await Promise.all(dirs.map(removeStorage));
});

describe('technology-finder', () => {
    it('returns technologies and charges one event per billable domain', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['stripe.com', 'empty.com'] }, endpoint: server.url });

        assert.equal(result.code, 0, result.output);
        const techs = result.items.filter((i) => i.technology_name);
        assert.equal(techs.length, 2);
        assert.deepEqual(techs[0], {
            input_domain: 'stripe.com',
            technology_slug: 'react',
            technology_name: 'React',
            technology_icon: 'React.svg',
            technology_website: 'https://react.dev',
            technology_description: 'A JavaScript library for building user interfaces.',
            category_id: 12,
            category_slug: 'javascript-frameworks',
            category_name: 'JavaScript frameworks',
            categories: ['JavaScript frameworks', 'JavaScript libraries'],
            source: 'tomba_technology_finder',
            charged: true,
            cached: false,
        });

        const empty = result.items.find((i) => i.input_domain === 'empty.com');
        assert.equal(empty?.charged, false);
        assert.equal(empty?.error, 'No technologies found');

        assert.deepEqual(result.chargeCounts, { 'tomba-request': 1 });
    });

    it('sends the built-in credentials to Tomba', async () => {
        const server = await mock();
        await run({ input: { domains: ['stripe.com'] }, endpoint: server.url });
        assert.equal(server.requests[0].headers['x-tomba-key'], 'ta_test_key');
        assert.equal(server.requests[0].headers['x-tomba-secret'], 'ts_test_secret');
    });

    it('normalizes and deduplicates domains', async () => {
        const server = await mock();
        await run({
            input: { domains: ['https://www.Stripe.com/pricing', 'stripe.com', 'STRIPE.COM'] },
            endpoint: server.url,
        });
        assert.deepEqual(
            server.requests.map((r) => r.query.domain),
            ['stripe.com'],
        );
    });

    it('does not charge Tomba error statuses and does not retry them', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['invalid.com'] }, endpoint: server.url });
        assert.equal(result.code, 0, result.output);
        assert.equal(server.requests.length, 1);
        assert.equal(result.items[0].charged, false);
        assert.match(String(result.items[0].error), /422: Invalid domain/);
        assert.equal(totalCharges(result), 0);
    });

    it('does not charge a non-JSON body', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['html.com'] }, endpoint: server.url });
        assert.equal(result.items[0].charged, false);
        assert.match(String(result.items[0].error), /Invalid response/);
        assert.equal(totalCharges(result), 0);
    });

    it('retries 429 and 5xx responses, then charges the success once', async () => {
        let calls = 0;
        const server = await mock(async (req) => {
            calls++;
            if (calls === 1)
                return {
                    status: 429,
                    body: { errors: { message: 'Too many requests' } },
                    headers: { 'retry-after': '1' },
                };
            if (calls === 2) return { status: 503, body: {} };
            return tomba(req);
        });
        const result = await run({ input: { domains: ['stripe.com'], maxRetries: 3 }, endpoint: server.url });
        assert.equal(server.requests.length, 3);
        assert.equal(result.items[0].charged, true);
        assert.deepEqual(result.chargeCounts, { 'tomba-request': 1 });
    });

    it('serves repeated runs from the cache for free', async () => {
        const server = await mock();
        const first = await run({ input: { domains: ['stripe.com'] }, endpoint: server.url });
        const second = await run({
            input: { domains: ['stripe.com'] },
            endpoint: server.url,
            storageDir: first.storageDir,
        });

        assert.equal(server.requests.length, 1);
        assert.equal(second.items.length, 2);
        assert.ok(second.items.every((i) => i.cached === true && i.charged === false));
        assert.equal(totalCharges(second), 0);
    });

    it('calls Tomba again when the cache is disabled', async () => {
        const server = await mock();
        const first = await run({ input: { domains: ['stripe.com'], useCache: false }, endpoint: server.url });
        await run({
            input: { domains: ['stripe.com'], useCache: false },
            endpoint: server.url,
            storageDir: first.storageDir,
        });
        assert.equal(server.requests.length, 2);
    });

    it('stops at the max charge limit and resumes without reprocessing', async () => {
        const server = await mock();
        const domains = ['a.com', 'b.com', 'c.com', 'd.com', 'e.com'];
        const input = { domains, maxConcurrency: 1, useCache: false, maxResults: 100 };

        // Locally every event costs $1, so a $2 budget allows two billable requests.
        const first = await run({ input, endpoint: server.url, maxTotalChargeUsd: 2 });
        assert.equal(first.code, 0, first.output);
        assert.equal(totalCharges(first), 2);
        assert.equal(server.requests.length, 2);

        const second = await run({ input, endpoint: server.url, storageDir: first.storageDir, keepStorage: true });
        assert.equal(second.code, 0, second.output);
        assert.deepEqual(
            server.requests.map((r) => r.query.domain),
            domains,
        );
    });

    it('respects maxResults', async () => {
        const server = await mock();
        const result = await run({
            input: { domains: ['a.com', 'b.com'], maxResults: 1, maxConcurrency: 1 },
            endpoint: server.url,
        });
        assert.equal(result.items.length, 1);
    });

    it('runs requests in parallel', async () => {
        let active = 0;
        let peak = 0;
        const server = await mock(async (req) => {
            active++;
            peak = Math.max(peak, active);
            await new Promise((r) => {
                setTimeout(r, 100);
            });
            active--;
            return tomba(req);
        });
        const domains = Array.from({ length: 8 }, (_, i) => `site${i}.com`);
        await run({ input: { domains, maxConcurrency: 4 }, endpoint: server.url });
        assert.equal(server.requests.length, 8);
        assert.ok(peak > 1 && peak <= 4, `peak concurrency ${peak}`);
    });

    it('fails without Tomba credentials and never calls the API', async () => {
        const server = await mock();
        const result = await run({ input: { domains: ['stripe.com'] }, endpoint: server.url, withCredentials: false });
        assert.notEqual(result.code, 0);
        assert.match(result.output, /misconfigured/);
        assert.doesNotMatch(result.output, /ta_test_key|ts_test_secret/);
        assert.equal(server.requests.length, 0);
    });

    it('does not report "no technologies" for a domain cut off by maxResults', async () => {
        const server = await mock(async (req) => {
            // Delay the second domain so the first one fills maxResults first.
            if (req.query.domain === 'b.com') {
                await new Promise((r) => {
                    setTimeout(r, 200);
                });
            }
            return tomba(req);
        });
        const result = await run({
            input: { domains: ['a.com', 'b.com'], maxResults: 2, maxConcurrency: 2 },
            endpoint: server.url,
        });
        assert.equal(result.code, 0, result.output);
        assert.equal(result.items.length, 2);
        assert.ok(result.items.every((i) => i.input_domain === 'a.com' && !i.error));
    });

    it('fails on empty input', async () => {
        const server = await mock();
        const result = await run({ input: { domains: [] }, endpoint: server.url });
        assert.notEqual(result.code, 0);
        assert.equal(server.requests.length, 0);
    });
});
