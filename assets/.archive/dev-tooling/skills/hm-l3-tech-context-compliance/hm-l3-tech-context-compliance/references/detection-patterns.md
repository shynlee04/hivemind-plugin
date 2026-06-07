# Detection Patterns — Auto-Detect Tech Stack

## Purpose

This reference provides detection patterns for auto-identifying the project's tech stack from manifest files, config files, and import statements. Each ecosystem section covers: indicator files, extraction commands, version resolution, and edge cases.

## Detection Order

Run detection in this priority order:
1. **Manifest files** (highest reliability) — `package.json`, `requirements.txt`, `go.mod`, etc.
2. **Build configs** — `tsconfig.json`, `Makefile`, `Dockerfile`
3. **Import patterns** (fallback when no manifests found) — `import`, `require`, `from` statements

Stop scanning an ecosystem once a primary indicator file is found and parsed.

---

## Node.js / TypeScript Ecosystem

### Primary Indicators

| File | What It Reveals | Priority |
|------|----------------|----------|
| `package.json` | Dependencies, devDependencies, engines, scripts, workspaces | 1 |
| `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` | Locked versions, lockfile format version | 2 |
| `tsconfig.json` | TypeScript version target, module system, path aliases | 2 |
| `.nvmrc` / `.node-version` | Node.js runtime version | 1 |
| `eslint.config.*` / `.eslintrc.*` | Linting framework, plugin ecosystem | 3 |

### Extraction Commands

```bash
# Extract runtime version
grep -oP '"node"\s*:\s*"\K[^"]+' package.json 2>/dev/null || \
  grep -oP '"engines"\s*:\s*\{[^}]*"node"\s*:\s*"\K[^"]+' package.json 2>/dev/null || \
  cat .nvmrc 2>/dev/null || \
  cat .node-version 2>/dev/null

# Extract core dependencies with versions
node -e "const p=require('./package.json'); Object.entries({...p.dependencies,...p.devDependencies}).forEach(([k,v])=>console.log(k+':'+v))" 2>/dev/null

# Identify package manager from lock file
ls package-lock.json 2>/dev/null && echo "npm" || \
ls yarn.lock 2>/dev/null && echo "yarn" || \
ls pnpm-lock.yaml 2>/dev/null && echo "pnpm" || \
echo "unknown"

# Detect framework from dependencies
grep -oP '"react"\s*:\s*"\K[^"]+' package.json 2>/dev/null && echo "React detected"
grep -oP '"next"\s*:\s*"\K[^"]+' package.json 2>/dev/null && echo "Next.js detected"
grep -oP '"vue"\s*:\s*"\K[^"]+' package.json 2>/dev/null && echo "Vue detected"
grep -oP '"express"\s*:\s*"\K[^"]+' package.json 2>/dev/null && echo "Express detected"
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Monorepo with workspaces | Check root `package.json` for `workspaces` field. Scan each workspace's `package.json`. |
| No lock file | Use semver ranges from `package.json`. Flag `NEEDS_INVESTIGATION` for un-pinned versions. |
| Multiple package managers | If both `package-lock.json` AND `yarn.lock` exist, warn about ambiguity. Check `.npmrc` for `package-manager` setting. |
| `engines` missing | Search for `.nvmrc`, `.node-version`, or check CI configs (`.github/workflows/*.yml`). |

### TypeScript-Specific

```bash
# Detect TypeScript version
grep -oP '"typescript"\s*:\s*"\K[^"]+' package.json 2>/dev/null

# Check module resolution mode
grep -oP '"moduleResolution"\s*:\s*"\K[^"]+' tsconfig.json 2>/dev/null

# Check target
grep -oP '"target"\s*:\s*"\K[^"]+' tsconfig.json 2>/dev/null
```

---

## Python Ecosystem

### Primary Indicators

| File | What It Reveals | Priority |
|------|----------------|----------|
| `pyproject.toml` | Dependencies, build system, Python version constraint | 1 |
| `requirements.txt` | Pinned or ranged dependencies | 1 |
| `Pipfile` / `Pipfile.lock` | Pipenv dependencies with locked versions | 2 |
| `poetry.lock` | Poetry locked dependency tree | 2 |
| `setup.py` / `setup.cfg` | Legacy dependency declarations | 3 |
| `.python-version` | Python runtime version (pyenv) | 1 |

### Extraction Commands

```bash
# Detect Python version
python3 --version 2>/dev/null || python --version 2>/dev/null
cat .python-version 2>/dev/null || \
grep -oP 'python_requires\s*=\s*"\K[^"]+' pyproject.toml 2>/dev/null || \
grep -oP 'requires-python\s*=\s*"\K[^"]+' pyproject.toml 2>/dev/null

# Extract dependencies from requirements.txt
cat requirements.txt 2>/dev/null | grep -v '^#' | grep -v '^$' | grep -v '^-'

# Extract dependencies from pyproject.toml
grep -A 20 '\[project\]' pyproject.toml 2>/dev/null | grep -oP '"[^"]+"'

# Identify package manager
ls Pipfile 2>/dev/null && echo "pipenv"
ls poetry.lock 2>/dev/null && echo "poetry"
ls requirements.txt 2>/dev/null && echo "pip"
ls pyproject.toml 2>/dev/null && echo "pip/pipenv/poetry (check build-system section)"
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Multiple requirement files | Check `requirements/` directory. Read `requirements-dev.txt`, `requirements-prod.txt`. |
| Conda environment | Look for `environment.yml`. Parse `dependencies:` section. |
| `pyproject.toml` without `[project]` | May be a build-only config (e.g., Ruff, Black). Check `[tool.poetry]` or `[tool.pipenv]`. |
| Virtual environment | Check `venv/`, `.venv/`, or ask for `pip freeze` output if available. |

---

## Go Ecosystem

### Primary Indicators

| File | What It Reveals | Priority |
|------|----------------|----------|
| `go.mod` | Module name, Go version, direct dependencies (versioned) | 1 |
| `go.sum` | Dependency checksums, indirect dependencies | 2 |

### Extraction Commands

```bash
# Extract Go version
grep -oP '^go \K[0-9.]+' go.mod 2>/dev/null

# Extract direct dependencies
grep -oP '^\t\K[^ ]+ v[^ ]+' go.mod 2>/dev/null

# Extract module name
grep -oP '^module \K.*' go.mod 2>/dev/null

# Detect framework from dependencies
grep -oP 'github.com/gin-gonic/gin' go.mod 2>/dev/null && echo "Gin detected"
grep -oP 'github.com/labstack/echo' go.mod 2>/dev/null && echo "Echo detected"
grep -oP 'github.com/gorilla/mux' go.mod 2>/dev/null && echo "Gorilla Mux detected"
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| No `go.sum` | `go mod download` creates it. If unavailable, trust `go.mod` versions only. |
| Multi-module repo | Each `go.mod` is a separate module. Scan for all `**/go.mod` files. |
| Replace directives | `go.mod` `replace` directives override versions. Extract these for accurate version resolution. |

---

## Rust Ecosystem

### Primary Indicators

| File | What It Reveals | Priority |
|------|----------------|----------|
| `Cargo.toml` | Dependencies, features, edition, rust-version | 1 |
| `Cargo.lock` | Locked dependency versions, exact resolutions | 2 |
| `rust-toolchain.toml` | Rust toolchain version | 2 |

### Extraction Commands

```bash
# Extract Rust version
grep -oP 'rust-version\s*=\s*"\K[^"]+' Cargo.toml 2>/dev/null || \
rustc --version 2>/dev/null

# Extract dependencies
grep -A 100 '\[dependencies\]' Cargo.toml 2>/dev/null | \
  grep -oP '^\K[^ =]+' | head -50

# Extract dependency versions
grep -A 100 '\[dependencies\]' Cargo.toml 2>/dev/null | \
  grep -oP '=\s*"\K[^"]+'

# Detect edition
grep -oP 'edition\s*=\s*"\K[^"]+' Cargo.toml 2>/dev/null
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Workspace members | Root `Cargo.toml` lists `[workspace.members]`. Check each member's `Cargo.toml`. |
| Feature flags | Parse `[features]` section. Dependencies may be feature-gated. |
| Git dependencies | `Cargo.toml` may reference `git = "..."` instead of version. Flag as `NEEDS_INVESTIGATION`. |
| `Cargo.lock` not committed | For libraries (not binaries), `.lock` may be gitignored. Use `Cargo.toml` ranges. |

---

## JVM Ecosystem (Java / Kotlin / Scala)

### Primary Indicators

| File | What It Reveals | Priority |
|------|----------------|----------|
| `pom.xml` | Maven dependencies, properties, plugins, parent POM | 1 |
| `build.gradle` / `build.gradle.kts` | Gradle dependencies, plugins, repositories | 1 |
| `settings.gradle` / `settings.gradle.kts` | Multi-module configuration | 2 |
| `gradle.properties` | Version properties, JVM args | 3 |
| `.java-version` | Java version (jenv) | 2 |

### Extraction Commands

```bash
# Detect Java version
java -version 2>&1 | head -1
cat .java-version 2>/dev/null

# Check build tool
ls pom.xml 2>/dev/null && echo "Maven"
ls build.gradle* 2>/dev/null && echo "Gradle"
ls build.gradle.kts 2>/dev/null && echo "Gradle (Kotlin DSL)"

# Extract Maven dependencies (basic)
grep -oP '<artifactId>\K[^<]+' pom.xml 2>/dev/null | head -30

# Extract Gradle dependencies (basic)
grep -oP "(implementation|api|compileOnly|testImplementation)\s*['\"]\K[^'\"]+" build.gradle* 2>/dev/null
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Parent POM | Check `<parent>` section for inherited versions. Read parent POM if local. |
| BOM (Bill of Materials) | Version managed by BOM. Check `dependencyManagement` section. |
| Gradle version catalogs | `libs.versions.toml` in `gradle/` directory. Parse `[versions]` and `[libraries]`. |
| Kotlin vs Java | Check for `kotlin` plugin or `.kt` files. Extract Kotlin version from build config. |

---

## .NET Ecosystem

### Primary Indicators

| File | What It Reveals | Priority |
|------|----------------|----------|
| `*.csproj` / `*.fsproj` | Project references, package references, target framework | 1 |
| `*.sln` | Solution configuration | 2 |
| `packages.config` | Legacy NuGet dependency format | 2 |
| `Directory.Build.props` | Shared build properties | 3 |
| `global.json` | .NET SDK version | 2 |

### Extraction Commands

```bash
# Detect .NET version
dotnet --version 2>/dev/null
cat global.json 2>/dev/null | grep -oP '"version"\s*:\s*"\K[^"]+'

# Extract target framework
grep -oP '<TargetFramework>\K[^<]+' *.csproj 2>/dev/null

# Extract NuGet packages
grep -oP '<PackageReference Include="\K[^"]+' *.csproj 2>/dev/null

# Extract package versions
grep -oP '<PackageReference Include="[^"]+" Version="\K[^"]+' *.csproj 2>/dev/null
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Central Package Management | Check `Directory.Packages.props` for centralized versions. |
| Multi-target frameworks | `<TargetFrameworks>` (plural) lists multiple. Check each. |
| `global.json` missing | Use `dotnet --version` output. If unavailable, check project SDK attribute. |
| Legacy `packages.config` | Older format, may coexist with `PackageReference`. Check both. |

---

## Other Ecosystems (Quick Reference)

### Ruby

```bash
ls Gemfile 2>/dev/null && echo "Bundler detected"
grep -oP "gem\s+['\"]\K[^'\"]+" Gemfile 2>/dev/null
ruby --version 2>/dev/null
```

### PHP

```bash
ls composer.json 2>/dev/null && echo "Composer detected"
grep -oP '"\K[^"]+"\s*:\s*"[^"]+"' composer.json 2>/dev/null | head -20
php --version 2>/dev/null | head -1
```

### Elixir

```bash
ls mix.exs 2>/dev/null && echo "Mix detected"
grep -oP '{:\K[^,]+' mix.exs 2>/dev/null
elixir --version 2>/dev/null
```

---

## Multi-Ecosystem Detection

When a project has indicators from multiple ecosystems:

1. **Is this a monorepo?** Check for workspace/multi-module configs.
2. **Is this polyglot?** Some projects genuinely use Node+Python (e.g., ML projects with Python backend + React frontend).
3. **Is it a migration?** Old `requirements.txt` + new `pyproject.toml` = use the newer format.
4. **Build tool overlap:** If `package.json` AND `Makefile` exist, note that Make is orchestrating npm.

### Detection Algorithm

```
1. Scan for ALL manifest files (glob: **/{package.json,requirements.txt,go.mod,Cargo.toml,pom.xml,build.gradle*,mix.exs,Gemfile,composer.json,*.csproj})
2. Group by directory — each manifest directory is a potential sub-project
3. For each group, classify the ecosystem using the rules above
4. For groups in the same root, determine if they're independent projects or a polyglot app
5. Report: "Detected N ecosystems: [list with locations]"
```

---

## Fallback: No Manifest Files

If no recognized manifest files exist:

1. **Check Dockerfiles** — `FROM` line reveals base image and likely tech stack.
2. **Check CI configs** — `.github/workflows/*.yml`, `.gitlab-ci.yml` may reveal install steps.
3. **Scan imports** — `grep -r "^import\|^require\|^from\|^use " --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.rs"`
4. **Report NEEDS_CONTEXT** — if nothing can be auto-detected, ask the user to declare the stack.

---

## After Detection: Persist

Store the detected stack summary for reuse by downstream skills:

```bash
# Write detection summary
mkdir -p .hivemind/evidence/
cat > .hivemind/evidence/tech-stack-detected.md << 'EOF'
## Detected Tech Stack

| Ecosystem | Runtime | Key Frameworks | Package Manager |
|-----------|---------|----------------|-----------------|
| ... | ... | ... | ... |

Detected: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
```
