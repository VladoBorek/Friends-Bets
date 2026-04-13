#!/usr/bin/env node

/**
 * Complete development setup script
 * Runs all initialization steps in the correct order with clear error reporting
 */

import { spawn } from "child_process";
import { existsSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[36m";
const RESET = "\x1b[0m";

interface Step {
  name: string;
  cmd: string;
  args: string[];
  cwd?: string;
  required?: boolean;
  description?: string;
}

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const bunCmd = process.platform === "win32" ? "bun.exe" : "bun";
const dockerCmd = process.platform === "win32" ? "docker.exe" : "docker";

async function getPackageManager(): Promise<"bun" | "npm"> {
  const bunVersion = await runCommand(bunCmd, ["--version"], undefined, true);
  return bunVersion === 0 ? "bun" : "npm";
}

const steps: Step[] = [
  {
    name: "Shared Dependencies",
    cmd: "PACKAGE_MANAGER",
    args: ["install"],
    cwd: resolve(process.cwd(), "shared"),
    description: "Install shared package dependencies (Zod schemas)",
  },
  {
    name: "Server Dependencies",
    cmd: "PACKAGE_MANAGER",
    args: ["install"],
    cwd: resolve(process.cwd(), "server"),
    description: "Install server package dependencies",
  },
  {
    name: "Client Dependencies",
    cmd: "PACKAGE_MANAGER",
    args: ["install"],
    cwd: resolve(process.cwd(), "client"),
    description: "Install client package dependencies",
  },
  {
    name: "TanStack Router Plugin",
    cmd: "ROUTER_PLUGIN_PACKAGE_MANAGER",
    args: [],
    cwd: resolve(process.cwd(), "client"),
    description: "Ensure @tanstack/router-plugin is installed for Vite plugin import",
  },
  {
    name: "Database Schema Generation",
    cmd: "PACKAGE_MANAGER",
    args: ["run", "db:generate"],
    description: "Generate Drizzle migrations from schema",
  },
  {
    name: "Database Migration",
    cmd: "PACKAGE_MANAGER",
    args: ["run", "db:migrate"],
    description: "Apply database migrations",
  },
  {
    name: "Database Seeding",
    cmd: "PACKAGE_MANAGER",
    args: ["run", "db:seed"],
    description: "Seed database with sample data",
  },
  {
    name: "API Client Generation",
    cmd: "PACKAGE_MANAGER",
    args: ["run", "api:generate"],
    description: "Generate TypeScript client and React Query hooks from OpenAPI",
  },
  {
    name: "Linting",
    cmd: npmCmd,
    args: ["run", "lint"],
    description: "Run ESLint to check for code issues",
    required: false,
  },
];

function runCommand(cmd: string, args: string[], cwd?: string, silent = false): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd: cwd || process.cwd(),
      stdio: silent ? "ignore" : "inherit",
      shell: true,
    });

    proc.on("close", (code) => resolve(code ?? 1));
    proc.on("error", () => resolve(1));
  });
}

async function ensurePostgresContainer(): Promise<boolean> {
  console.log(`\n${BLUE}[prep] Docker PostgreSQL${RESET}`);

  const dockerVersion = await runCommand(dockerCmd, ["--version"]);
  if (dockerVersion !== 0) {
    console.warn(`${YELLOW}⚠ Docker is not available. Skipping automatic PostgreSQL container setup.${RESET}`);
    return true;
  }

  // Check whether container exists.
  const inspectExit = await runCommand(dockerCmd, ["inspect", "pb138"], process.cwd(), true);

  if (inspectExit === 0) {
    const startExit = await runCommand(dockerCmd, ["start", "pb138"]);
    if (startExit === 0) {
      console.log(`${GREEN}✓ PostgreSQL container 'pb138' is running${RESET}`);
      return true;
    }

    console.error(`${RED}✗ Failed to start existing Docker container 'pb138'.${RESET}`);
    return false;
  }

  const runExit = await runCommand(dockerCmd, [
    "run",
    "--detach",
    "--name",
    "pb138",
    "-e",
    "POSTGRES_USER=user",
    "-e",
    "POSTGRES_PASSWORD=password",
    "-e",
    "POSTGRES_DB=database",
    "-p",
    "5432:5432",
    "postgres:latest",
  ]);

  if (runExit !== 0) {
    console.error(
      `${RED}✗ Failed to create Docker container 'pb138'. Ensure Docker daemon is running and port 5432 is free.${RESET}`,
    );
    return false;
  }

  console.log(`${GREEN}✓ PostgreSQL container 'pb138' created and started${RESET}`);
  return true;
}

async function runStep(step: Step, stepNumber: number, totalSteps: number, packageManager: "bun" | "npm"): Promise<boolean> {
  const prefix = `[${stepNumber}/${totalSteps}]`;
  console.log(`\n${BLUE}${prefix} ${step.name}${RESET}`);
  if (step.description) {
    console.log(`  ${YELLOW}→ ${step.description}${RESET}`);
  }

  let cmd = step.cmd;
  let args = [...step.args];
  if (step.cmd === "PACKAGE_MANAGER") {
    cmd = packageManager === "bun" ? bunCmd : npmCmd;
  } else if (step.cmd === "ROUTER_PLUGIN_PACKAGE_MANAGER") {
    cmd = packageManager === "bun" ? bunCmd : npmCmd;
    args = packageManager === "bun" ? ["add", "@tanstack/router-plugin"] : ["install", "@tanstack/router-plugin"];
  }

  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd: step.cwd || process.cwd(),
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`${GREEN}✓ ${step.name} completed${RESET}`);
        resolve(true);
      } else {
        const required = step.required !== false;
        if (required) {
          console.error(`${RED}✗ ${step.name} failed with exit code ${code}${RESET}`);
        } else {
          console.warn(`${YELLOW}⚠ ${step.name} failed but continuing (non-critical)${RESET}`);
        }
        resolve(!required);
      }
    });

    proc.on("error", (err) => {
      console.error(`${RED}✗ ${step.name} failed: ${err.message}${RESET}`);
      resolve(step.required === false);
    });
  });
}

async function main() {
  console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${BLUE}  PB138 Full Project Setup${RESET}`);
  console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);

  const packageManager = await getPackageManager();
  console.log(`${GREEN}✓ Using package manager: ${packageManager}${RESET}`);

  // Check .env exists
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.warn(`${YELLOW}⚠ .env file not found${RESET}`);
    console.log(`Creating .env from .env.example (if exists)...`);
    const examplePath = resolve(process.cwd(), ".env.example");
    if (existsSync(examplePath)) {
      const content = readFileSync(examplePath, "utf-8");
      writeFileSync(envPath, content);
      console.log(`${GREEN}✓ .env file created${RESET}`);
    } else {
      console.error(
        `${RED}✗ Neither .env nor .env.example found. Please create .env with DATABASE_URL set.${RESET}`,
      );
      process.exit(1);
    }
  } else {
    console.log(`${GREEN}✓ .env file found${RESET}`);
  }

  const dbReady = await ensurePostgresContainer();
  if (!dbReady) {
    process.exit(1);
  }

  let failed = false;
  for (let i = 0; i < steps.length; i++) {
    const success = await runStep(steps[i], i + 1, steps.length, packageManager);
    if (!success) {
      failed = true;
      break;
    }
  }

  console.log(`\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);

  if (failed) {
    console.error(`${RED}Setup failed. Please fix the errors above and run again.${RESET}`);
    process.exit(1);
  }

  console.log(`${GREEN}✓ Setup completed successfully!${RESET}`);
  console.log(`\n${YELLOW}Next steps:${RESET}`);
  console.log(`  1. Run API server:   npm run server`);
  console.log(`  2. Run frontend:     npm run client`);
  console.log(`\nAPI runs on http://localhost:3000`);
  console.log(`Frontend runs on http://localhost:5173`);
  console.log(`\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
}

main().catch((err) => {
  console.error(`${RED}Fatal error: ${err.message}${RESET}`);
  process.exit(1);
});
