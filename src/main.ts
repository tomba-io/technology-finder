import { Actor, log } from 'apify';
import { Technology } from 'tomba';

import type { RunOptions } from './tomba.js';
import { callTomba, logSummary, normalizeDomain, runPool, setupTomba, stop, unique, useRunState } from './tomba.js';

interface TechnologyFinderInput extends RunOptions {
    domains: string[];
    maxResults?: number;
}

const SOURCE = 'tomba_technology_finder';

await Actor.init();

const input = await Actor.getInput<TechnologyFinderInput>();
if (!input?.domains?.length) {
    await Actor.fail('Input must contain at least one domain in "domains".');
}

const { domains: rawDomains, maxResults = 50, ...runOptions } = input!;
const client = await setupTomba(runOptions);
const technology = new Technology(client);
const state = await useRunState();

const domains = unique(rawDomains.map(normalizeDomain));
const pending = domains.filter((domain) => !state.done[domain]);
if (pending.length < domains.length) {
    log.info(`Resuming: ${domains.length - pending.length} domains already processed.`);
}

let pushed = 0;
const startedAt = Date.now();
log.info(`Finding technologies for ${pending.length} domains`);

await runPool(pending, async (domain) => {
    if (pushed >= maxResults) {
        stop();
        return;
    }

    const res = await callTomba('technology', { domain }, async () => technology.list(domain));
    if (res.skipped) return;

    const technologies = Array.isArray(res.data) ? (res.data as Record<string, unknown>[]) : [];
    const items = technologies.slice(0, Math.max(0, maxResults - pushed)).map((tech) => {
        // Tomba returns `categories` as an array; older responses used a single object.
        const categoryList = (Array.isArray(tech.categories) ? tech.categories : [tech.categories]).filter(
            (c): c is Record<string, unknown> => typeof c === 'object' && c !== null,
        );
        const categories = categoryList[0];
        return {
            input_domain: domain,
            technology_slug: tech.slug ? String(tech.slug) : undefined,
            technology_name: tech.name ? String(tech.name) : undefined,
            technology_icon: tech.icon ? String(tech.icon) : undefined,
            technology_website: tech.website ? String(tech.website) : undefined,
            technology_description: tech.description ? String(tech.description) : undefined,
            category_id: typeof categories?.id === 'number' ? categories.id : undefined,
            category_slug: categories?.slug ? String(categories.slug) : undefined,
            category_name: categories?.name ? String(categories.name) : undefined,
            categories: categoryList.map((c) => String(c.name ?? c.slug ?? '')).filter(Boolean),
            source: SOURCE,
            charged: res.charged,
            cached: res.cached,
        };
    });

    if (items.length === 0 && technologies.length > 0) {
        // Another domain reached maxResults while this request was running: not a "no results" answer.
        stop();
        return;
    }

    if (items.length > 0) {
        pushed += items.length;
        await Actor.pushData(items);
        log.info(`${domain}: ${items.length} technologies${res.cached ? ' (cached)' : ''}`);
    } else {
        await Actor.pushData({
            input_domain: domain,
            technology_name: null,
            source: SOURCE,
            charged: res.charged,
            cached: res.cached,
            error: res.error ?? 'No technologies found',
        });
        log.info(`${domain}: ${res.error ?? 'no technologies found'}`);
    }

    state.done[domain] = true;
});

logSummary('Technology Finder', domains.length, startedAt);

await Actor.exit();
