# Tomba Technology Finder

[![Price](https://img.shields.io/badge/Price-%243.12%20per%201K%20domains-brightgreen)](#pricing)
[![No signup](https://img.shields.io/badge/Tomba%20account-not%20needed-blue)](#quick-start)
[![No rate limit](https://img.shields.io/badge/Rate%20limit-none-brightgreen)](#built-for-big-lists)

**See the tech stack behind any website in seconds.** Paste a list of domains and get every detected technology (frameworks, CMS, analytics, marketing tools, hosting, payments and more), organized by category and ready to export.

No Tomba account. No API key. No subscription. **You pay $0.00312 per domain, and only when we find something.**

## Why teams choose this Actor

- **Start in 30 seconds**: Open the Actor, paste your domains, click Start. Nothing to sign up for
- **Pay only for results**: Domains with no detected technologies, errors and invalid inputs are free
- **$3.12 per 1,000 domains**: No monthly plan, no credits that expire, no minimum spend
- **Built for big lists**: No rate limit. Thousands of domains run in parallel
- **Never pay twice**: Domains you looked up in the last 24 hours come back from cache for free
- **Clean input, clean output**: Paste URLs or domains in any format; duplicates are removed automatically
- **Export anywhere**: Download as CSV, Excel or JSON, or send results straight to your CRM with Apify integrations

## What you can do with it

| Goal                      | How the tech stack helps                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Qualify leads**         | Target companies that use (or don't use) a specific tool, like Shopify, HubSpot or Salesforce |
| **Personalize outreach**  | Open with the tools your prospect already runs and how you fit in                             |
| **Win competitive deals** | Find every company using a competitor's product                                               |
| **Find partners**         | Spot companies running complementary technologies                                             |
| **Research markets**      | Measure technology adoption across an industry or region                                      |

## Quick start

1. Click **Try for free**
2. Paste your domains into **Domains** (for example `stripe.com`, `shopify.com`)
3. Click **Start**, then download your results as CSV, Excel or JSON

That's it. No Tomba account or API key is needed.

## Input

| Field            | Required | Default | Description                                                                   |
| ---------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `domains`        | Yes      |         | Domains to analyze. URLs like `https://www.stripe.com/pricing` are cleaned up |
| `maxResults`     | No       | `50`    | Maximum number of technology rows to return                                   |
| `maxConcurrency` | No       | `10`    | How many domains to process at the same time (1–50)                           |
| `maxRetries`     | No       | `3`     | How many times to retry a temporary failure (0–10)                            |
| `useCache`       | No       | `true`  | Reuse results from your previous runs for free                                |
| `cacheTtlHours`  | No       | `24`    | How long cached results stay valid (`0` turns the cache off)                  |

```json
{
    "domains": ["shopify.com", "github.com", "stripe.com"],
    "maxResults": 500
}
```

## Output

You get one row per detected technology:

```json
{
    "input_domain": "tomba.io",
    "technology_slug": "webpack",
    "technology_name": "webpack",
    "technology_icon": "webpack.svg",
    "technology_website": "https://webpack.js.org/",
    "technology_description": "Webpack is an open-source JavaScript module bundler.",
    "category_id": 19,
    "category_slug": "miscellaneous",
    "category_name": "Miscellaneous",
    "categories": ["Miscellaneous"],
    "source": "tomba_technology_finder",
    "charged": true,
    "cached": false
}
```

| Field                    | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `input_domain`           | The domain you submitted                                          |
| `technology_name`        | Name of the detected technology                                   |
| `technology_slug`        | Unique identifier of the technology                               |
| `technology_icon`        | Icon file name of the technology                                  |
| `technology_website`     | Official website of the technology                                |
| `technology_description` | Short description of the technology                               |
| `category_id`            | ID of the technology category                                     |
| `category_slug`          | Slug of the technology category                                   |
| `category_name`          | Main category, e.g. Analytics, Web servers, JavaScript frameworks |
| `categories`             | All categories of the technology                                  |
| `source`                 | Always `tomba_technology_finder`                                  |
| `charged`                | `true` if this lookup was billed                                  |
| `cached`                 | `true` if this result came from the cache (free)                  |
| `error`                  | Why no technologies were returned, if applicable                  |

The dataset has three ready-made views: **Overview**, **Detailed** and **Technologies by Category**.

## Pricing

**$0.00312 per domain ($3.12 per 1,000).** No subscription and no Tomba account needed.

You are only charged when Tomba returns a usable answer:

| What happens                                    | Charged |
| ----------------------------------------------- | ------- |
| Technologies found for the domain               | Yes     |
| No technologies found for the domain            | No      |
| Invalid domain or any other error               | No      |
| Temporary failure (it is retried automatically) | No      |
| Result served from the cache                    | No      |

Every row shows `charged` and `cached`, so you always know what you paid for. To cap your spend, set **Maximum cost per run** in the run options: the Actor stops cleanly when the limit is reached.

## Built for big lists

- **No rate limit**: up to 50 domains are processed at the same time
- **Automatic retries**: temporary failures are retried for you, and never billed
- **Resumable**: if a run is interrupted, it continues where it stopped without charging you again
- **Cache**: repeat lookups within 24 hours are free

## Technologies we detect

- **Web**: React, Vue.js, Angular, jQuery
- **CMS & e-commerce**: WordPress, Drupal, Shopify, WooCommerce, Magento
- **Analytics & marketing**: Google Analytics, HubSpot, Mailchimp, Google Tag Manager
- **Infrastructure**: AWS, Google Cloud, Cloudflare, Nginx, Apache
- **Payments**: Stripe, PayPal, Square

## Integrations

Run it on a schedule, call it from the Apify API, or connect it to Zapier, Make, Google Sheets, HubSpot, Slack and hundreds of other apps with [Apify integrations](https://docs.apify.com/platform/integrations). Webhooks let you trigger your own workflow as soon as a run finishes.

## FAQ

**Do I need a Tomba account or API key?**
No. Everything is built in. You only pay the per-domain price on Apify.

**How much does it cost?**
$0.00312 per domain with results ($3.12 per 1,000). Domains with no results, errors and cached lookups are free.

**How many domains can I analyze in one run?**
Up to 1,000 per run, processed in parallel. There is no rate limit.

**What domain format should I use?**
Anything works: `stripe.com`, `www.stripe.com` or `https://stripe.com/pricing`. We clean it up and remove duplicates.

**What if my run is interrupted?**
It picks up where it stopped. Domains already processed are not charged again.

**Why are some technologies missing?**
Custom-built or hidden tools leave no public signature, so they can't be detected. Popular technologies are detected reliably.

**How do I limit what I spend?**
Set **Maximum cost per run** before you start. The Actor stops as soon as the limit is reached.

## Support

Questions or feedback? We're happy to help:

- **Email**: support@tomba.io
- **Live chat**: on [tomba.io](https://tomba.io) during business hours
- **Issues**: use the **Issues** tab on this Actor's page

## About Tomba

Founded in 2020, [Tomba](https://tomba.io) is a B2B data platform for finding, verifying and enriching business contacts. Our Email Finder, Domain Search and Email Verifier help sales and marketing teams reach the right people.

![Tomba Logo](https://tomba.io/logo.png)
