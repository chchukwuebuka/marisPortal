/**
 * Single import surface for data-access services. All exports speak to the
 * real Django API — no mock data.
 */

export * from "./catalogue";
export * from "./documents";
export * from "./payments";
