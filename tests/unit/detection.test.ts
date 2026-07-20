import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { Detector } from "../../src/detection/index.js";

function createFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "detection-test-"));
  mkdirSync(join(dir, ".git"));
  return dir;
}

function writePkg(dir: string, content: Record<string, unknown>): void {
  writeFileSync(join(dir, "package.json"), JSON.stringify(content));
}

function writeFile(dir: string, name: string, content = ""): void {
  writeFileSync(join(dir, name), content);
}

function mkdir(dir: string, name: string): void {
  mkdirSync(join(dir, name), { recursive: true });
}

describe("Detector", () => {
  let fixture: string;

  beforeEach(() => {
    fixture = createFixture();
  });

  afterEach(() => {
    rmSync(fixture, { recursive: true, force: true });
  });

  describe("package manager detection", () => {
    it("detects pnpm from lock file", () => {
      writeFile(fixture, "pnpm-lock.yaml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("pnpm");
    });

    it("detects bun from bun.lockb", () => {
      writeFile(fixture, "bun.lockb");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("bun");
    });

    it("detects bun from bun.lock", () => {
      writeFile(fixture, "bun.lock");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("bun");
    });

    it("detects yarn from yarn.lock", () => {
      writeFile(fixture, "yarn.lock");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("yarn");
    });

    it("detects npm from package-lock.json", () => {
      writeFile(fixture, "package-lock.json");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("npm");
    });

    it("detects pnpm from packageManager field", () => {
      writePkg(fixture, { packageManager: "pnpm@8.0.0" });
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("pnpm");
    });

    it("detects yarn from packageManager field", () => {
      writePkg(fixture, { packageManager: "yarn@4.0.0" });
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("yarn");
    });

    it("falls back to npm when no lock file or field present", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("npm");
    });

    it("returns null for packageManager when no package.json", () => {
      const d = new Detector(fixture);
      expect(d.detect().packageManager).toBe("npm");
    });

    it("detects packageManagerVersion from packageManager field", () => {
      writePkg(fixture, { packageManager: "pnpm@8.15.0" });
      const d = new Detector(fixture);
      expect(d.detect().packageManagerVersion).toBe("8.15.0");
    });

    it("returns null packageManagerVersion when no field", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManagerVersion).toBeNull();
    });

    it("detects npm version from lockfileVersion 3", () => {
      writeFile(fixture, "package-lock.json", JSON.stringify({ lockfileVersion: 3 }));
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManagerVersion).toBe("9.x");
    });

    it("detects npm version from lockfileVersion 2", () => {
      writeFile(fixture, "package-lock.json", JSON.stringify({ lockfileVersion: 2 }));
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManagerVersion).toBe("8.x");
    });

    it("detects npm version from lockfileVersion 1", () => {
      writeFile(fixture, "package-lock.json", JSON.stringify({ lockfileVersion: 1 }));
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().packageManagerVersion).toBe("6.x-7.x");
    });
  });

  describe("monorepo detection", () => {
    it("detects turborepo from turbo.json", () => {
      writeFile(fixture, "turbo.json");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("turborepo");
    });

    it("detects turborepo from dependency", () => {
      writePkg(fixture, { devDependencies: { turbo: "^1.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("turborepo");
    });

    it("detects nx from nx.json", () => {
      writeFile(fixture, "nx.json");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("nx");
    });

    it("detects nx from @nrwl/workspace", () => {
      writePkg(fixture, { devDependencies: { "@nrwl/workspace": "^15.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("nx");
    });

    it("detects nx from nx dependency", () => {
      writePkg(fixture, { devDependencies: { nx: "^16.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("nx");
    });

    it("detects lerna from lerna.json", () => {
      writeFile(fixture, "lerna.json");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("lerna");
    });

    it("detects lerna from dependency", () => {
      writePkg(fixture, { devDependencies: { lerna: "^6.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("lerna");
    });

    it("detects workspaces from workspaces array", () => {
      writePkg(fixture, { workspaces: ["packages/*"] });
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("workspaces");
    });

    it("detects workspaces from workspaces object with packages", () => {
      writePkg(fixture, { workspaces: { packages: ["packages/*"] } });
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBe("workspaces");
    });

    it("returns null when no monorepo tool", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().monorepo).toBeNull();
    });

    it("sets workspaces true when workspaces array present", () => {
      writePkg(fixture, { workspaces: ["packages/*"] });
      const d = new Detector(fixture);
      expect(d.detect().workspaces).toBe(true);
    });

    it("sets workspaces false when no workspaces", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().workspaces).toBe(false);
    });
  });

  describe("framework detection", () => {
    it("detects next", () => {
      writePkg(fixture, { dependencies: { next: "^14.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("next");
    });

    it("detects react", () => {
      writePkg(fixture, { dependencies: { react: "^18.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("react");
    });

    it("detects vue", () => {
      writePkg(fixture, { dependencies: { vue: "^3.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("vue");
    });

    it("detects svelte", () => {
      writePkg(fixture, { dependencies: { svelte: "^4.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("svelte");
    });

    it("detects angular", () => {
      writePkg(fixture, { dependencies: { angular: "^17.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("angular");
    });

    it("detects astro", () => {
      writePkg(fixture, { dependencies: { astro: "^4.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("astro");
    });

    it("detects nuxt and adds vue", () => {
      writePkg(fixture, { dependencies: { nuxt: "^3.0.0" } });
      const d = new Detector(fixture);
      const fws = d.detect().frameworks;
      expect(fws).toContain("nuxt");
      expect(fws).toContain("vue");
    });

    it("detects express", () => {
      writePkg(fixture, { dependencies: { express: "^4.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("express");
    });

    it("detects nestjs", () => {
      writePkg(fixture, { dependencies: { "@nestjs/core": "^10.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("nestjs");
    });

    it("detects fastify", () => {
      writePkg(fixture, { dependencies: { fastify: "^4.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toContain("fastify");
    });

    it("detects multiple frameworks", () => {
      writePkg(fixture, { dependencies: { react: "^18.0.0", express: "^4.0.0" } });
      const d = new Detector(fixture);
      const fws = d.detect().frameworks;
      expect(fws).toContain("react");
      expect(fws).toContain("express");
    });

    it("returns empty array when no frameworks", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().frameworks).toEqual([]);
    });

    it("does not duplicate react when astro and react are both deps", () => {
      writePkg(fixture, { dependencies: { astro: "^4.0.0", react: "^18.0.0" } });
      const d = new Detector(fixture);
      const fws = d.detect().frameworks;
      expect(fws).toContain("astro");
      expect(fws).toContain("react");
      expect(fws.filter((f) => f === "react").length).toBe(1);
    });
  });

  describe("test framework detection", () => {
    it("detects vitest", () => {
      writePkg(fixture, { devDependencies: { vitest: "^1.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().testFrameworks).toContain("vitest");
    });

    it("detects jest", () => {
      writePkg(fixture, { devDependencies: { jest: "^29.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().testFrameworks).toContain("jest");
    });

    it("detects mocha", () => {
      writePkg(fixture, { devDependencies: { mocha: "^10.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().testFrameworks).toContain("mocha");
    });

    it("detects playwright", () => {
      writePkg(fixture, { devDependencies: { playwright: "^1.40.0" } });
      const d = new Detector(fixture);
      expect(d.detect().testFrameworks).toContain("playwright");
    });

    it("detects cypress", () => {
      writePkg(fixture, { devDependencies: { cypress: "^13.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().testFrameworks).toContain("cypress");
    });

    it("detects multiple test frameworks", () => {
      writePkg(fixture, { devDependencies: { vitest: "^1.0.0", cypress: "^13.0.0" } });
      const d = new Detector(fixture);
      const tfs = d.detect().testFrameworks;
      expect(tfs).toContain("vitest");
      expect(tfs).toContain("cypress");
    });

    it("returns empty array when no test frameworks", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().testFrameworks).toEqual([]);
    });
  });

  describe("linter detection", () => {
    it("detects eslint from .eslintrc", () => {
      writeFile(fixture, ".eslintrc");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("eslint");
    });

    it("detects eslint from .eslintrc.json", () => {
      writeFile(fixture, ".eslintrc.json");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("eslint");
    });

    it("detects eslint from .eslintrc.js", () => {
      writeFile(fixture, ".eslintrc.js");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("eslint");
    });

    it("detects eslint from eslint.config.js", () => {
      writeFile(fixture, "eslint.config.js");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("eslint");
    });

    it("detects eslint from dependency", () => {
      writePkg(fixture, { devDependencies: { eslint: "^9.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("eslint");
    });

    it("detects prettier from .prettierrc", () => {
      writeFile(fixture, ".prettierrc");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("prettier");
    });

    it("detects prettier from .prettierrc.json", () => {
      writeFile(fixture, ".prettierrc.json");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("prettier");
    });

    it("detects prettier from .prettierrc.js", () => {
      writeFile(fixture, ".prettierrc.js");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("prettier");
    });

    it("detects prettier from dependency", () => {
      writePkg(fixture, { devDependencies: { prettier: "^3.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("prettier");
    });

    it("detects biome from biome.json", () => {
      writeFile(fixture, "biome.json");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("biome");
    });

    it("detects biome from dependency", () => {
      writePkg(fixture, { devDependencies: { "@biomejs/biome": "^1.5.0" } });
      const d = new Detector(fixture);
      expect(d.detect().linters).toContain("biome");
    });

    it("detects multiple linters", () => {
      writeFile(fixture, ".eslintrc");
      writeFile(fixture, ".prettierrc");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      const linters = d.detect().linters;
      expect(linters).toContain("eslint");
      expect(linters).toContain("prettier");
    });

    it("returns empty array when no linters", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().linters).toEqual([]);
    });
  });

  describe("CI provider detection", () => {
    it("detects github-actions from .github/workflows", () => {
      mkdir(fixture, ".github/workflows");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("github-actions");
    });

    it("detects gitlab-ci from .gitlab-ci.yml", () => {
      writeFile(fixture, ".gitlab-ci.yml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("gitlab-ci");
    });

    it("detects gitlab-ci from .gitlab directory", () => {
      mkdir(fixture, ".gitlab");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("gitlab-ci");
    });

    it("detects circleci from .circleci/config.yml", () => {
      mkdir(fixture, ".circleci");
      writeFile(fixture, ".circleci/config.yml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("circleci");
    });

    it("detects travis-ci from .travis.yml", () => {
      writeFile(fixture, ".travis.yml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("travis-ci");
    });

    it("detects jenkins from Jenkinsfile", () => {
      writeFile(fixture, "Jenkinsfile");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("jenkins");
    });

    it("detects azure-pipelines from azure-pipelines.yml", () => {
      writeFile(fixture, "azure-pipelines.yml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("azure-pipelines");
    });

    it("detects azure-pipelines from azure-pipelines.yaml", () => {
      writeFile(fixture, "azure-pipelines.yaml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("azure-pipelines");
    });

    it("detects azure-pipelines from .azure-pipelines directory", () => {
      mkdir(fixture, ".azure-pipelines");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toContain("azure-pipelines");
    });

    it("returns empty array when no CI providers", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().ciProviders).toEqual([]);
    });
  });

  describe("Docker detection", () => {
    it("detects Dockerfile", () => {
      writeFile(fixture, "Dockerfile");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().docker).toBe(true);
    });

    it("detects lowercase dockerfile", () => {
      writeFile(fixture, "dockerfile");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().docker).toBe(true);
    });

    it("detects docker-compose.yml", () => {
      writeFile(fixture, "docker-compose.yml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().dockerCompose).toBe(true);
    });

    it("detects docker-compose.yaml", () => {
      writeFile(fixture, "docker-compose.yaml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().dockerCompose).toBe(true);
    });

    it("detects compose.yml", () => {
      writeFile(fixture, "compose.yml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().dockerCompose).toBe(true);
    });

    it("detects compose.yaml", () => {
      writeFile(fixture, "compose.yaml");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().dockerCompose).toBe(true);
    });

    it("returns false for docker when no Dockerfile", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().docker).toBe(false);
    });
  });

  describe("git detection", () => {
    it("detects git repo from .git directory", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().git).toBe(true);
    });

    it("returns false when no .git directory", () => {
      const dir = mkdtempSync(join(tmpdir(), "no-git-"));
      writePkg(dir, {});
      const d = new Detector(dir);
      expect(d.detect().git).toBe(false);
      rmSync(dir, { recursive: true, force: true });
    });
  });

  describe("Node version detection", () => {
    it("detects node version from engines field", () => {
      writePkg(fixture, { engines: { node: ">=18.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().nodeVersion).toBe(">=18.0.0");
    });

    it("detects node version from .nvmrc", () => {
      writeFile(fixture, ".nvmrc", "20.11.0");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().nodeVersion).toBe("20.11.0");
    });

    it("detects node version from volta", () => {
      writePkg(fixture, { volta: { node: "18.18.0" } });
      const d = new Detector(fixture);
      expect(d.detect().nodeVersion).toBe("18.18.0");
    });

    it("engines field takes precedence over nvmrc", () => {
      writePkg(fixture, { engines: { node: ">=20.0.0" } });
      writeFile(fixture, ".nvmrc", "18.0.0");
      const d = new Detector(fixture);
      expect(d.detect().nodeVersion).toBe(">=20.0.0");
    });

    it("returns null when no node version specified", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().nodeVersion).toBeNull();
    });
  });

  describe("TypeScript detection", () => {
    it("detects typescript from tsconfig.json", () => {
      writeFile(fixture, "tsconfig.json");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().typescript).toBe(true);
    });

    it("detects typescript from dependency", () => {
      writePkg(fixture, { devDependencies: { typescript: "^5.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().typescript).toBe(true);
    });

    it("returns false when no typescript", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().typescript).toBe(false);
    });
  });

  describe("git hooks detection", () => {
    it("detects husky from dependency", () => {
      writePkg(fixture, { devDependencies: { husky: "^9.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().gitHooks).toContain("husky");
    });

    it("detects husky from .husky directory", () => {
      mkdir(fixture, ".husky");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().gitHooks).toContain("husky");
    });

    it("detects commitlint from @commitlint/cli", () => {
      writePkg(fixture, { devDependencies: { "@commitlint/cli": "^18.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().gitHooks).toContain("commitlint");
    });

    it("detects commitlint from @commitlint/config-conventional", () => {
      writePkg(fixture, { devDependencies: { "@commitlint/config-conventional": "^18.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().gitHooks).toContain("commitlint");
    });

    it("detects commitlint from .commitlintrc", () => {
      writeFile(fixture, ".commitlintrc");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().gitHooks).toContain("commitlint");
    });

    it("detects commitlint from commitlint.config.js", () => {
      writeFile(fixture, "commitlint.config.js");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().gitHooks).toContain("commitlint");
    });
  });

  describe("changesets detection", () => {
    it("detects changesets from @changesets/cli dependency", () => {
      writePkg(fixture, { devDependencies: { "@changesets/cli": "^2.0.0" } });
      const d = new Detector(fixture);
      expect(d.detect().changesets).toBe(true);
    });

    it("detects changesets from .changeset directory", () => {
      mkdir(fixture, ".changeset");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().changesets).toBe(true);
    });
  });

  describe("npm package type", () => {
    it("detects application when private is true", () => {
      writePkg(fixture, { private: true });
      const d = new Detector(fixture);
      expect(d.detect().npmPackageType).toBe("application");
    });

    it("detects library when name starts with @", () => {
      writePkg(fixture, { name: "@scope/pkg" });
      const d = new Detector(fixture);
      expect(d.detect().npmPackageType).toBe("library");
    });

    it("detects application when bin is present", () => {
      writePkg(fixture, { bin: "./cli.js" });
      const d = new Detector(fixture);
      expect(d.detect().npmPackageType).toBe("application");
    });

    it("returns library as default", () => {
      writePkg(fixture, { name: "my-pkg" });
      const d = new Detector(fixture);
      expect(d.detect().npmPackageType).toBe("library");
    });

    it("returns null when no package.json", () => {
      const d = new Detector(fixture);
      expect(d.detect().npmPackageType).toBeNull();
    });
  });

  describe("JavaScript detection", () => {
    it("returns true when package.json exists", () => {
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().javascript).toBe(true);
    });

    it("returns false when no package.json", () => {
      const d = new Detector(fixture);
      expect(d.detect().javascript).toBe(false);
    });
  });

  describe("documentation files detection", () => {
    it("detects README.md", () => {
      writeFile(fixture, "README.md");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().hasReadme).toBe(true);
    });

    it("detects README without extension", () => {
      writeFile(fixture, "README");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().hasReadme).toBe(true);
    });

    it("detects LICENSE.md", () => {
      writeFile(fixture, "LICENSE.md");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().hasLicense).toBe(true);
    });

    it("detects SECURITY.md", () => {
      writeFile(fixture, "SECURITY.md");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().hasSecurity).toBe(true);
    });

    it("detects CONTRIBUTING.md", () => {
      writeFile(fixture, "CONTRIBUTING.md");
      writePkg(fixture, {});
      const d = new Detector(fixture);
      expect(d.detect().hasContributing).toBe(true);
    });
  });
});
