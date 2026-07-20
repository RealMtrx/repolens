#!/usr/bin/env node

import { run } from "../dist/index.js";

run().catch((error) => {
  const isDebug = process.argv.includes("--debug");
  if (isDebug && error instanceof Error) {
    process.stderr.write(`${error.stack}\n`);
  } else if (error instanceof Error) {
    process.stderr.write(`\n  ${error.message}\n\n`);
  } else {
    process.stderr.write(`\n  An unexpected error occurred. Use --debug for details.\n\n`);
  }
  process.exit(1);
});
