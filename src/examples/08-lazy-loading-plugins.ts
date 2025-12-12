/**
 * @file 08 - Lazy Loading Plugins (TypeScript)
 *
 * Demonstrates how to use lazy loading for plugins to reduce initial bundle size.
 * This approach loads plugins on-demand only when they are needed.
 *
 * To run: node -r ts-node/register examples/08-lazy-loading-plugins.ts
 */

import atemporal from "../index";

// Async function to demonstrate lazy loading
async function demoLazyLoading() {
  console.log("--- 8. Lazy Loading Plugins Example ---");

  // Initially no plugins are loaded
  console.log("\nInitially loaded plugins:", atemporal.getLoadedPlugins());
  console.log("Available plugins:", atemporal.getAvailablePlugins());

  // Load relativeTime plugin on demand
  console.log("\nLoading relativeTime plugin...");
  await atemporal.lazyLoad("relativeTime");

  // Now we can use the plugin functionality
  const twoHoursAgo = atemporal().subtract(2, "hour");
  // We use a type assertion to help TypeScript
  console.log(`Two hours ago: "${(twoHoursAgo as any).fromNow()}"`); // "2 hours ago"

  // Verify that the plugin is loaded
  console.log(
    "\nIs relativeTime loaded?",
    atemporal.isPluginLoaded("relativeTime")
  );
  console.log("Currently loaded plugins:", atemporal.getLoadedPlugins());

  // Load another plugin on demand
  console.log("\nLoading durationHumanizer plugin...");
  await atemporal.lazyLoad("durationHumanizer");

  // Use the second plugin functionality
  const myDuration = atemporal.duration({ years: 1, months: 6, days: 15 });
  // We use a type assertion to help TypeScript
  console.log(
    `Humanized duration: "${(atemporal as any).humanize(myDuration)}"`
  );

  // Test multiple loading
  console.log("\nLoading multiple plugins at once...");
  await atemporal.lazyLoadMultiple(["advancedFormat", "weekDay"]);
  console.log("All loaded plugins:", atemporal.getLoadedPlugins());

  // Try to load an already loaded plugin (should not do anything)
  console.log("\nTrying to load relativeTime again...");
  await atemporal.lazyLoad("relativeTime");
  console.log("Loaded plugins remain the same:", atemporal.getLoadedPlugins());
}

// Run the demo

demoLazyLoading().catch((error) => {
  console.error("Error in lazy loading demo:", error);
});
