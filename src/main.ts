import { Actor } from 'apify';
import { Technology, TombaClient } from 'tomba';

interface TechnologyFinderInput {
    tombaApiKey: string;
    tombaApiSecret: string;
    domains: string[];
    maxResults?: number;
}

// Rate limiting function - 150 requests per minute
async function rateLimit(lastRequestTime: number): Promise<void> {
    const minInterval = 60000 / 150; // 150 requests per minute
    const timeSinceLastRequest = Date.now() - lastRequestTime;

    if (timeSinceLastRequest < minInterval) {
        const delay = minInterval - timeSinceLastRequest;
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), delay);
        });
    }
}

await Actor.init();

try {
    const input = await Actor.getInput<TechnologyFinderInput>();

    if (!input) {
        throw new Error('Input is required');
    }

    const { tombaApiKey, tombaApiSecret, domains, maxResults = 50 } = input;

    if (!tombaApiKey || !tombaApiSecret) {
        throw new Error('Tomba API key and secret are required');
    }

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
        throw new Error('At least one domain is required');
    }

    // Initialize Tomba client
    const client = new TombaClient();
    const technology = new Technology(client);

    client.setKey(tombaApiKey).setSecret(tombaApiSecret);

    console.log(`Starting technology discovery for ${domains.length} domains`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let lastRequestTime = 0;
    const startTime = Date.now();

    for (const domain of domains) {
        if (processedCount >= maxResults) {
            console.log(`Reached maximum results limit of ${maxResults}`);
            break;
        }

        try {
            // Apply rate limiting
            await rateLimit(lastRequestTime);
            lastRequestTime = Date.now();

            console.log(`Finding technologies for: ${domain}`);

            const result = await technology.list(domain);

            if (result && typeof result === 'object') {
                const resultData = result as Record<string, unknown>;

                if (resultData.data && Array.isArray(resultData.data)) {
                    const technologies = resultData.data;

                    // Handle the response which contains technologies
                    if (technologies.length > 0) {
                        for (const tech of technologies) {
                            if (typeof tech === 'object' && tech !== null) {
                                const techData = tech as Record<string, unknown>;
                                const categories = techData.categories as Record<string, unknown> | undefined;

                                const technologyResult = {
                                    input_domain: domain,
                                    technology_slug: techData.slug ? String(techData.slug) : undefined,
                                    technology_name: techData.name ? String(techData.name) : undefined,
                                    technology_icon: techData.icon ? String(techData.icon) : undefined,
                                    technology_website: techData.website ? String(techData.website) : undefined,
                                    category_id:
                                        categories && typeof categories.id === 'number' ? categories.id : undefined,
                                    category_slug: categories && categories.slug ? String(categories.slug) : undefined,
                                    category_name: categories && categories.name ? String(categories.name) : undefined,
                                    source: 'tomba_technology_finder',
                                };

                                await Actor.pushData(technologyResult);
                                processedCount++;
                                successCount++;

                                console.log(
                                    `Found technology: ${technologyResult.technology_name} (Category: ${technologyResult.category_name})`,
                                );
                            }
                        }
                    } else {
                        console.log(`No technologies found for: ${domain}`);

                        const noResultsData = {
                            input_domain: domain,
                            technology_name: null,
                            source: 'tomba_technology_finder',
                            error: 'No technologies found',
                        };

                        await Actor.pushData(noResultsData);
                        processedCount++;
                        errorCount++;
                    }
                } else {
                    console.log(`No data returned for domain: ${domain}`);

                    const errorResult = {
                        input_domain: domain,
                        technology_name: null,
                        source: 'tomba_technology_finder',
                        error: 'No data returned from API',
                    };

                    await Actor.pushData(errorResult);
                    processedCount++;
                    errorCount++;
                }
            } else {
                console.log(`Invalid response for domain: ${domain}`);

                const errorResult = {
                    input_domain: domain,
                    technology_name: null,
                    source: 'tomba_technology_finder',
                    error: 'Invalid API response',
                };

                await Actor.pushData(errorResult);
                processedCount++;
                errorCount++;
            }
        } catch (error) {
            console.error(`Error finding technologies for ${domain}:`, error);

            const errorResult = {
                input_domain: domain,
                technology_name: null,
                source: 'tomba_technology_finder',
                error: error instanceof Error ? error.message : 'Unknown error',
            };

            await Actor.pushData(errorResult);
            processedCount++;
            errorCount++;
        }

        // Small delay between requests
        await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 100);
        });
    }

    const endTime = Date.now();
    const executionTime = Math.round((endTime - startTime) / 1000);
    const successRate = processedCount > 0 ? Math.round((successCount / processedCount) * 100) : 0;
    const avgTimePerDomain = processedCount > 0 ? Math.round(executionTime / processedCount) : 0;

    // Log comprehensive summary
    console.log('\n TECHNOLOGY FINDER SUMMARY');
    console.log('================================');
    console.log(`Total domains processed: ${processedCount}/${domains.length}`);
    console.log(`Successful searches: ${successCount}`);
    console.log(`Failed searches: ${errorCount}`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Total execution time: ${executionTime} seconds`);
    console.log(`Average time per domain: ${avgTimePerDomain} seconds`);
    console.log(`API requests made: ${domains.length}`);
    console.log(`Rate limiting: 150 requests/minute (${Math.round(60000 / 150)}ms interval)`);
    console.log('================================');

    console.log(`Technology discovery completed. Processed ${processedCount} results.`);
} catch (error) {
    console.error('Technology discovery failed:', error);
    throw error;
}

await Actor.exit();
