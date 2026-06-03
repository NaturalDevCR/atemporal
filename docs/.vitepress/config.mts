import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Atemporal",
  description: "A modern and ergonomic date-time library, powered by the Temporal API.",
  base: '/atemporal/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'Migration', link: '/migration/' },
      { text: 'LLMs', link: '/atemporal/llms.txt', target: '_blank' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Overview', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Performance & Caching', link: '/guide/performance' },
            { text: 'Temporal Detection', link: '/guide/temporal-detection' },
            { text: 'Playground', link: '/guide/playground' },
            { text: 'Contributing', link: '/guide/contributing' },
            { text: 'Code of Conduct', link: '/guide/code-of-conduct' },
            { text: 'License', link: '/guide/license' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Creating Instances', link: '/api/creating-instances' },
            { text: 'Manipulation', link: '/api/manipulation' },
            { text: 'Formatting', link: '/api/formatting' },
            { text: 'Comparison & Difference', link: '/api/comparison-difference' },
            { text: 'Durations & Utilities', link: '/api/durations-utilities' },
            { text: 'Generating Ranges', link: '/api/ranges' },
          ]
        }
      ],
      '/plugins/': [
        {
          text: 'Plugins',
          items: [
            { text: 'Overview', link: '/plugins/' },
            { text: 'relativeTime', link: '/plugins/relative-time' },
            { text: 'customParseFormat', link: '/plugins/custom-parse-format' },
            { text: 'advancedFormat', link: '/plugins/advanced-format' },
            { text: 'weekDay', link: '/plugins/week-day' },
            { text: 'durationHumanizer', link: '/plugins/duration-humanizer' },
            { text: 'dateRangeOverlap', link: '/plugins/date-range-overlap' },
            { text: 'businessDays', link: '/plugins/business-days' },
            { text: 'timeSlots', link: '/plugins/time-slots' },
          ]
        }
      ],
      '/migration/': [
        {
          text: 'Migration',
          items: [
            { text: 'Overview', link: '/migration/' },
            { text: 'From Day.js', link: '/migration/dayjs' },
            { text: 'From Luxon', link: '/migration/luxon' },
            { text: 'From moment.js', link: '/migration/moment' },
            { text: 'From raw Temporal', link: '/migration/temporal' },
          ]
        }
      ],
      '/cookbook/': [
        {
          text: 'Cookbook',
          items: [
            { text: 'Overview', link: '/cookbook/' },
            { text: 'REST input validation', link: '/cookbook/rest-validation' },
            { text: 'Prisma', link: '/cookbook/prisma' },
            { text: 'Drizzle', link: '/cookbook/drizzle' },
            { text: 'React Server Components', link: '/cookbook/rsc' },
            { text: 'Cloudflare Workers', link: '/cookbook/cloudflare' },
            { text: 'Structured logging', link: '/cookbook/logging' },
            { text: 'Microservice timezones', link: '/cookbook/microservice-tz' },
            { text: 'Audit log timestamps', link: '/cookbook/audit-log' },
            { text: 'Business hours scheduling', link: '/cookbook/business-hours' },
            { text: 'i18n formatting', link: '/cookbook/i18n' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/NaturalDevCR/atemporal' }
    ],
    search: {
      provider: 'local'
    }
  }
})
