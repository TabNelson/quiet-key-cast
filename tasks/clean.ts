import { task } from "hardhat/config";
import { rm } from "fs/promises";

task("clean:all", "Clean all build artifacts and caches")
  .setAction(async () => {
    console.log("🧹 Cleaning all build artifacts and caches...");

    const dirsToClean = [
      "artifacts",
      "cache",
      "coverage",
      "fhevmTemp",
      "types",
      "ui/dist",
      "ui/node_modules/.vite"
    ];

    for (const dir of dirsToClean) {
      try {
        await rm(dir, { recursive: true, force: true });
        console.log(`✅ Cleaned: ${dir}`);
      } catch (error) {
        // Directory doesn't exist, skip silently
      }
    }

    console.log("✨ Clean complete!");
  });

task("clean:contracts", "Clean contract build artifacts only")
  .setAction(async () => {
    console.log("🧹 Cleaning contract artifacts...");

    const dirsToClean = [
      "artifacts",
      "cache",
      "fhevmTemp",
      "types"
    ];

    for (const dir of dirsToClean) {
      try {
        await rm(dir, { recursive: true, force: true });
        console.log(`✅ Cleaned: ${dir}`);
      } catch (error) {
        // Directory doesn't exist, skip silently
      }
    }

    console.log("✨ Contract cleanup complete!");
  });
