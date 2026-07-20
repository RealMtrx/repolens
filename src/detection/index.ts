import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import type {
  DetectedTechnologies,
  PackageManager,
  MonorepoTool,
  CiProvider,
  Framework,
  TestFramework,
  Linter,
  GitHook,
} from "../types/index.js";

const isPackageManager = (s: string): s is PackageManager =>
  s === "npm" || s === "pnpm" || s === "yarn" || s === "bun";

export class Detector {
  private root: string;
  private pkg: Record<string, unknown> | null = null;
  private pkgRaw: string | null = null;

  constructor(root: string) {
    this.root = root;
  }

  detect(): DetectedTechnologies {
    this.loadPkg();
    return {
      packageManager: this.detectPackageManager(),
      packageManagerVersion: this.detectPackageManagerVersion(),
      monorepo: this.detectMonorepoTool(),
      workspaces: this.hasWorkspaces(),
      frameworks: this.detectFrameworks(),
      testFrameworks: this.detectTestFrameworks(),
      linters: this.detectLinters(),
      gitHooks: this.detectGitHooks(),
      changesets: this.hasChangesets(),
      ciProviders: this.detectCiProviders(),
      docker: this.hasDockerfile(),
      dockerCompose: this.hasDockerCompose(),
      git: this.isGit(),
      nodeVersion: this.detectNodeVersion(),
      typescript: this.hasTypescript(),
      javascript: this.hasJavascript(),
      hasReadme: this.fileExists("README.md") || this.fileExists("README"),
      hasLicense:
        this.fileExists("LICENSE") ||
        this.fileExists("LICENSE.md") ||
        this.fileExists("LICENSE.txt"),
      hasSecurity: this.fileExists("SECURITY.md") || this.fileExists("SECURITY"),
      hasContributing: this.fileExists("CONTRIBUTING.md") || this.fileExists("CONTRIBUTING"),
      npmPackageType: this.detectNpmPackageType(),
      hasChangesetsConfig: this.dirExists(".changeset") || this.fileExists("changeset/config.json"),
    };
  }

  /* Package Manager */

  private detectPackageManager(): PackageManager | null {
    if (existsSync(join(this.root, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (existsSync(join(this.root, "bun.lockb"))) {
      return "bun";
    }
    if (existsSync(join(this.root, "bun.lock"))) {
      return "bun";
    }
    if (existsSync(join(this.root, "yarn.lock"))) {
      return "yarn";
    }
    if (this.root.includes("yarn") && existsSync(join(this.root, "yarn.lock"))) {
      return "yarn";
    }
    if (existsSync(join(this.root, "package-lock.json"))) {
      return "npm";
    }
    if (this.pkg) {
      const p = this.pkg;
      if (p.packageManager && typeof p.packageManager === "string") {
        const pm = p.packageManager.split("@")[0];
        if (pm && isPackageManager(pm)) {
          return pm;
        }
      }
    }
    return "npm";
  }

  private detectPackageManagerVersion(): string | null {
    if (!this.pkg) {
      return null;
    }
    const pmField = this.pkg.packageManager;
    if (pmField && typeof pmField === "string") {
      const parts = pmField.split("@");
      return parts[1] ?? null;
    }
    const lockFiles: [string, string][] = [
      ["pnpm-lock.yaml", "pnpm"],
      ["yarn.lock", "yarn"],
      ["package-lock.json", "npm"],
    ];
    for (const [file] of lockFiles) {
      const fp = join(this.root, file);
      if (existsSync(fp)) {
        try {
          const metaKey = file === "package-lock.json" ? "lockfileVersion" : null;
          if (metaKey) {
            const content = readFileSync(fp, "utf-8");
            const parsed = JSON.parse(content) as Record<string, unknown>;
            const lv = parsed.lockfileVersion;
            if (lv === 3) {
              return "9.x";
            }
            if (lv === 2) {
              return "8.x";
            }
            if (lv === 1) {
              return "6.x-7.x";
            }
          }
        } catch {
          /* ignore */
        }
      }
    }
    return null;
  }

  /* Monorepo */

  private detectMonorepoTool(): MonorepoTool | null {
    const deps = this.readDeps();
    if (deps.turbo || deps.turbo || this.fileExists("turbo.json")) {
      return "turborepo";
    }
    if (deps["@nrwl/workspace"] || deps.nx || this.fileExists("nx.json")) {
      return "nx";
    }
    if (deps.lerna || this.fileExists("lerna.json")) {
      return "lerna";
    }
    if (this.hasWorkspaces()) {
      return "workspaces";
    }
    return null;
  }

  private hasWorkspaces(): boolean {
    if (!this.pkg) {
      return false;
    }
    const w = this.pkg.workspaces;
    if (Array.isArray(w) && w.length > 0) {
      return true;
    }
    if (w && typeof w === "object" && (w as Record<string, unknown>).packages) {
      return true;
    }
    return false;
  }

  /* Frameworks */

  private detectFrameworks(): Framework[] {
    const deps = this.readDeps();
    const fw: Framework[] = [];
    const map: [string, Framework][] = [
      ["next", "next"],
      ["react", "react"],
      ["vue", "vue"],
      ["svelte", "svelte"],
      ["angular", "angular"],
      ["astro", "astro"],
      ["nuxt", "nuxt"],
      ["express", "express"],
      ["@nestjs/core", "nestjs"],
      ["fastify", "fastify"],
    ];
    for (const [pkgName, fwName] of map) {
      if (deps[pkgName]) {
        if (!fw.includes(fwName)) {
          fw.push(fwName);
        }
      }
    }
    if (fw.includes("nuxt") && !fw.includes("vue")) {
      fw.push("vue");
    }
    if (fw.includes("astro") && !fw.includes("react") && deps.react) {
      fw.push("react");
    }
    return fw;
  }

  /* Test Frameworks */

  private detectTestFrameworks(): TestFramework[] {
    const deps = this.readDeps();
    const tf: TestFramework[] = [];
    const map: [string, TestFramework][] = [
      ["vitest", "vitest"],
      ["jest", "jest"],
      ["mocha", "mocha"],
      ["playwright", "playwright"],
      ["cypress", "cypress"],
    ];
    for (const [pkgName, tfName] of map) {
      if (deps[pkgName] && !tf.includes(tfName)) {
        tf.push(tfName);
      }
    }
    return tf;
  }

  /* Linters */

  private detectLinters(): Linter[] {
    const li: Linter[] = [];
    if (
      this.fileExists(".eslintrc") ||
      this.fileExists(".eslintrc.json") ||
      this.fileExists(".eslintrc.js") ||
      this.fileExists("eslint.config.js") ||
      this.readDeps().eslint
    ) {
      li.push("eslint");
    }
    if (
      this.fileExists(".prettierrc") ||
      this.fileExists(".prettierrc.json") ||
      this.fileExists(".prettierrc.js") ||
      this.readDeps().prettier
    ) {
      li.push("prettier");
    }
    if (this.fileExists("biome.json") || this.readDeps()["@biomejs/biome"]) {
      li.push("biome");
    }
    return li;
  }

  /* Git Hooks */

  private detectGitHooks(): GitHook[] {
    const gh: GitHook[] = [];
    if (this.readDeps().husky || this.dirExists(".husky")) {
      gh.push("husky");
    }
    if (
      this.readDeps()["@commitlint/cli"] ||
      this.readDeps()["@commitlint/config-conventional"] ||
      this.fileExists(".commitlintrc") ||
      this.fileExists("commitlint.config.js")
    ) {
      gh.push("commitlint");
    }
    return gh;
  }

  /* Changesets */

  private hasChangesets(): boolean {
    return !!(this.readDeps()["@changesets/cli"] ?? this.dirExists(".changeset"));
  }

  /* CI */

  private detectCiProviders(): CiProvider[] {
    const ci: CiProvider[] = [];
    if (this.dirExists(".github/workflows")) {
      ci.push("github-actions");
    }
    if (this.dirExists(".gitlab") || this.fileExists(".gitlab-ci.yml")) {
      ci.push("gitlab-ci");
    }
    if (
      this.dirExists(".azure-pipelines") ||
      this.fileExists("azure-pipelines.yml") ||
      this.fileExists("azure-pipelines.yaml")
    ) {
      ci.push("azure-pipelines");
    }
    if (this.fileExists(".circleci/config.yml")) {
      ci.push("circleci");
    }
    if (this.fileExists(".travis.yml")) {
      ci.push("travis-ci");
    }
    if (this.fileExists("Jenkinsfile")) {
      ci.push("jenkins");
    }
    return ci;
  }

  /* Docker */

  private hasDockerfile(): boolean {
    return (
      this.fileExists("Dockerfile") ||
      this.fileExists("dockerfile") ||
      this.fileExists("Dockerfile.dockerignore")
    );
  }

  private hasDockerCompose(): boolean {
    return (
      this.fileExists("docker-compose.yml") ||
      this.fileExists("docker-compose.yaml") ||
      this.fileExists("compose.yml") ||
      this.fileExists("compose.yaml")
    );
  }

  /* Git */

  private isGit(): boolean {
    return this.dirExists(".git");
  }

  /* Node & JS */

  private detectNodeVersion(): string | null {
    if (this.pkg?.engines && typeof this.pkg.engines === "object") {
      const node = (this.pkg.engines as Record<string, unknown>).node;
      if (node && typeof node === "string") {
        return node;
      }
    }
    const nvmrc = join(this.root, ".nvmrc");
    if (existsSync(nvmrc)) {
      try {
        return readFileSync(nvmrc, "utf-8").trim();
      } catch {
        /* noop */
      }
    }
    const volta =
      this.pkg?.volta && typeof this.pkg.volta === "object"
        ? (this.pkg.volta as Record<string, unknown>).node
        : null;
    if (volta && typeof volta === "string") {
      return volta;
    }
    return null;
  }

  private hasTypescript(): boolean {
    return this.fileExists("tsconfig.json") || !!this.readDeps().typescript;
  }

  private hasJavascript(): boolean {
    return this.fileExists("package.json");
  }

  /* npm package type */

  private detectNpmPackageType(): "application" | "library" | null {
    if (!this.pkg) {
      return null;
    }
    if (this.pkg.private === true) {
      return "application";
    }
    const name = this.pkg.name;
    if (name && typeof name === "string" && name.startsWith("@")) {
      return "library";
    }
    const bin = this.pkg.bin;
    if (bin) {
      return "application";
    }
    return "library";
  }

  /* Helpers */

  private loadPkg(): void {
    const fp = join(this.root, "package.json");
    if (existsSync(fp)) {
      try {
        this.pkgRaw = readFileSync(fp, "utf-8");
        this.pkg = JSON.parse(this.pkgRaw) as Record<string, unknown>;
      } catch {
        /* noop */
      }
    }
  }

  private readDeps(): Record<string, string> {
    const all: Record<string, string> = {};
    if (!this.pkg) {
      return all;
    }
    for (const key of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      const deps = this.pkg[key];
      if (deps && typeof deps === "object") {
        Object.assign(all, deps as Record<string, string>);
      }
    }
    return all;
  }

  private fileExists(p: string): boolean {
    const fp = join(this.root, p);
    try {
      return existsSync(fp) && statSync(fp).isFile();
    } catch {
      return false;
    }
  }

  private dirExists(p: string): boolean {
    const fp = join(this.root, p);
    try {
      return existsSync(fp) && statSync(fp).isDirectory();
    } catch {
      return false;
    }
  }
}
