import { log } from 'apify';
import { Technology } from 'tomba';

import { InputError, queryInt, queryList, runActor } from './standby.js';
import type { RunOptions } from './tomba.js';
import { callTomba, getClient, normalizeDomain, runPool, unique } from './tomba.js';

interface TechnologyFinderInput extends RunOptions {
    domains?: string[];
    maxResults?: number;
}

const SOURCE = 'tomba_technology_finder';

await runActor<TechnologyFinderInput>({
    title: 'Technology Finder',
    count: (input) => input.domains?.length ?? 0,
    fromQuery: (query) => ({
        domains: queryList(query, 'domain', 'domains'),
        maxResults: queryInt(query, 'maxResults'),
    }),
    run: async (input, { push, isDone, markDone, standby }) => {
        if (!input.domains?.length) throw new InputError('Input must contain at least one domain in "domains".');

        const maxResults = input.maxResults ?? 50;
        const technology = new Technology(getClient());
        const domains = unique(input.domains.map(normalizeDomain));
        const pending = domains.filter((domain) => !isDone(domain));
        if (pending.length < domains.length) {
            log.info(`Resuming: ${domains.length - pending.length} domains already processed.`);
        }
        if (!standby) log.info(`Finding technologies for ${pending.length} domains`);

        let pushed = 0;
        const full = () => pushed >= maxResults;

        await runPool(
            pending,
            async (domain) => {
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

                // Another domain reached maxResults while this request was running: not a "no results" answer.
                if (items.length === 0 && technologies.length > 0) return;

                if (items.length > 0) {
                    pushed += items.length;
                    await push(items);
                    log.info(`${domain}: ${items.length} technologies${res.cached ? ' (cached)' : ''}`);
                } else {
                    await push({
                        input_domain: domain,
                        technology_name: null,
                        source: SOURCE,
                        charged: res.charged,
                        cached: res.cached,
                        error: res.error ?? 'No technologies found',
                    });
                    log.info(`${domain}: ${res.error ?? 'no technologies found'}`);
                }

                markDone(domain);
            },
            undefined,
            full,
        );
    },
});
