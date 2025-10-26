# Tomba Technology Finder Actor

[![Actor](https://img.shields.io/badge/Apify-Actor-blue)](https://apify.com/actors)
[![Tomba API](https://img.shields.io/badge/Tomba-API-green)](https://tomba.io)
[![Rate Limit](https://img.shields.io/badge/Rate%20Limit-150%2Fmin-orange)](https://tomba.io/api)

A powerful Apify Actor that discovers and retrieves technologies used by specific domains using the **Tomba Technology Finder API**. Perfect for competitive analysis, tech stack research, and understanding the technology landscape of websites and companies.

## Key Features

- **Technology Detection**: Identify technologies, frameworks, and tools used by websites
- **Comprehensive Categories**: Discover analytics, CMS, frameworks, libraries, and more
- **Confidence Scoring**: Get confidence levels for each technology detection
- **Version Information**: Retrieve version details when available
- **Pricing Intelligence**: Understand pricing models of detected technologies
- **Bulk Processing**: Analyze multiple domains efficiently with rate limiting
- **Rate Limited**: Respects Tomba's 150 requests per minute limit
- **Rich Data Output**: Comprehensive technology profiles with metadata
- **Built-in Error Handling**: Robust processing with comprehensive error reporting

## How it works

The Actor leverages Tomba's powerful Technology Finder API to analyze domains and detect their tech stack:

### Process Flow

1. **Authentication**: Connects to Tomba API using your credentials
2. **Input Processing**: Accepts array of domains to analyze
3. **Technology Discovery**: Uses Tomba's `list` method for each domain
4. **Data Enrichment**: Extracts technology details, categories, and confidence scores
5. **Rate Limiting**: Automatically handles 150 requests/minute limit
6. **Data Storage**: Saves results to Apify dataset

### What You Get

For each technology detected, you'll receive:

- **Technology Name**: The specific technology, framework, or tool
- **Category**: Main classification (Analytics, CMS, Framework, etc.)
- **Subcategory**: More specific classification
- **Description**: What the technology does
- **Confidence Score**: How certain the detection is
- **Version**: Version information when available
- **Pricing Model**: Free, Paid, Freemium, etc.
- **Official Website**: Link to the technology's website
- **Logo**: Technology logo URL

## Quick Start

### Prerequisites

1. **Tomba Account**: Sign up at [Tomba.io](https://app.tomba.io/api) to get your API credentials

### Getting Your API Keys

1. Visit [Tomba API Dashboard](https://app.tomba.io/api)
2. Copy your **API Key** (starts with `ta_`)
3. Copy your **Secret Key** (starts with `ts_`)

## Input Configuration

### Required Parameters

| Parameter        | Type       | Description                                  |
| ---------------- | ---------- | -------------------------------------------- |
| `tombaApiKey`    | `string`   | Your Tomba API key (ta_xxxx)                 |
| `tombaApiSecret` | `string`   | Your Tomba secret key (ts_xxxx)              |
| `domains`        | `string[]` | Array of domains to analyze for technologies |

### Optional Parameters

| Parameter    | Type     | Default | Description                         |
| ------------ | -------- | ------- | ----------------------------------- |
| `maxResults` | `number` | `50`    | Maximum number of results to return |

### Example Input

```json
{
    "tombaApiKey": "ta_xxxxxxxxxxxxxxxxxxxx",
    "tombaApiSecret": "ts_xxxxxxxxxxxxxxxxxxxx",
    "domains": ["shopify.com", "github.com", "stripe.com"],
    "maxResults": 100
}
```

### Best Practices

- **Domain Format**: Use clean domain names without protocols (e.g., 'example.com' not 'https://example.com')
- **Batch Size**: Process 10-15 domains at a time for optimal performance
- **Rate Limits**: The Actor automatically handles Tomba's 150 requests/minute limit
- **Quality Results**: Use established websites for more comprehensive technology detection
- **Analysis Focus**: Pay attention to confidence scores for reliable technology identification

## Output Data Structure

The Actor returns comprehensive information for each technology detected:

```json
{
    "input_domain": "tomba.io",
    "technology_slug": "webpack",
    "technology_name": "webpack",
    "technology_icon": "webpack.svg",
    "technology_website": "https://webpack.js.org/",
    "category_id": 19,
    "category_slug": "miscellaneous",
    "category_name": "Miscellaneous",
    "source": "tomba_technology_finder"
}
```

### Data Fields Explained

- **input_domain**: The original domain that was analyzed
- **technology_slug**: Unique slug identifier for the technology
- **technology_name**: Name of the detected technology
- **technology_icon**: Icon filename for the technology
- **technology_website**: Official website of the technology
- **category_id**: ID of the technology category
- **category_slug**: Slug of the technology category
- **category_name**: Name of the technology category (e.g., Analytics, Miscellaneous, JavaScript Libraries)
- **source**: Data source identifier (tomba_technology_finder)
- **error**: Error message if the analysis failed

## Use Cases

### Competitive Analysis

- **Tech Stack Intelligence**: Understand what technologies competitors are using
- **Technology Trends**: Identify popular technologies in your industry
- **Performance Analysis**: Compare technology choices with performance metrics

### Business Development

- **Partnership Opportunities**: Find companies using complementary technologies
- **Customer Targeting**: Identify prospects using specific technology stacks
- **Market Research**: Understand technology adoption patterns

### Sales & Marketing

- **Lead Qualification**: Target companies using specific technologies
- **Solution Positioning**: Tailor pitches based on existing tech stack
- **Market Segmentation**: Group prospects by technology preferences

### Product Development

- **Integration Planning**: Understand what technologies to integrate with
- **Technology Research**: Stay updated on industry technology trends
- **Competitive Intelligence**: Monitor competitor technology choices

## Technology Categories Detected

The Actor can detect technologies across various categories:

### Web Technologies

- **Frontend Frameworks**: React, Vue.js, Angular
- **Backend Frameworks**: Node.js, Django, Ruby on Rails
- **JavaScript Libraries**: jQuery, Lodash, Moment.js

### Analytics & Marketing

- **Web Analytics**: Google Analytics, Adobe Analytics
- **Marketing Tools**: Mailchimp, HubSpot, Salesforce
- **Tag Management**: Google Tag Manager, Adobe Launch

### Infrastructure & DevOps

- **Cloud Providers**: AWS, Google Cloud, Azure
- **CDN**: Cloudflare, AWS CloudFront
- **Web Servers**: Nginx, Apache, IIS

### E-commerce & CMS

- **E-commerce Platforms**: Shopify, WooCommerce, Magento
- **Content Management**: WordPress, Drupal, Joomla
- **Payment Processing**: Stripe, PayPal, Square

## Data Views

The Actor provides specialized data views:

### Overview View

Quick summary showing domain, technology, category, subcategory, confidence, and pricing

### Detailed View

Comprehensive view with all technology data, descriptions, and technical details

### Technologies by Category View

Organized view grouping technologies by their main categories for easier analysis

## Resources & Documentation

### API Documentation

- [Tomba API Docs](https://tomba.io/api) - Complete API reference
- [Technology Finder Endpoint](https://docs.tomba.io/api/technology) - Specific technology documentation
- [Authentication Guide](https://app.tomba.io/api) - Get your API keys
- [Pricing & Limits](https://tomba.io/pricing) - Understand rate limits and costs

### Rate Limiting

- Tomba limits to **150 requests per minute**
- Actor automatically handles rate limiting with delays
- Large domain lists may take time to complete

### Cost Considerations

- Each domain technology analysis = 1 Tomba API request
- Monitor your Tomba usage dashboard
- Consider Tomba's pricing tiers for volume usage
