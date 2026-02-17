import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Atemporal",
  description: "A modern and ergonomic date-time library, powered by the Temporal API.",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Plugins', link: '/plugins/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
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
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/NaturalDevCR/atemporal' }
    ]
  }
})
