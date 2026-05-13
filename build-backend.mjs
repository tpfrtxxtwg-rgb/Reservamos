#!/usr/bin/env node
/**
 * Backend build: Transpile TypeScript to JavaScript.
 * Uses esbuild CLI for transpilation + post-processing for imports.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const OUTDIR = path.join(ROOT, "dist", "server");

// Directories to transpile
const SOURCE_DIRS = ["api", "contracts", "db"];

// Clean output
fs.rmSync(OUTDIR, { recursive: true, force: true });

function findTsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

// Step 1: Find all .ts files
const tsFiles = SOURCE_DIRS.flatMap(d => {
  const dirPath = path.join(ROOT, d);
  return fs.existsSync(dirPath) ? findTsFiles(dirPath) : [];
});

console.log(`Found ${tsFiles.length} TypeScript files`);

// Step 2: Transpile each file individually with esbuild CLI
for (const tsFile of tsFiles) {
  const relativePath = path.relative(ROOT, tsFile);
  const outFile = path.join(OUTDIR, relativePath.replace(/\.ts$/, ".js"));
  
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  
  try {
    execSync(
      `npx esbuild "${tsFile}" --outfile="${outFile}" --platform=node --format=esm --bundle=false --loader:.ts=ts`,
      { stdio: "pipe" }
    );
  } catch (e) {
    console.error(`Failed to transpile ${relativePath}:`);
    console.error(e.stderr?.toString() || e.message);
    process.exit(1);
  }
}

console.log(`Transpiled ${tsFiles.length} files`);

// Step 3: Post-process all JS files - resolve aliases and add .js extensions
function resolveAlias(importPath, sourceFile) {
  if (importPath.startsWith("@db/")) {
    const target = importPath.replace("@db/", "db/");
    return relativeImportPath(sourceFile, target);
  }
  if (importPath.startsWith("@contracts/")) {
    const target = importPath.replace("@contracts/", "contracts/");
    return relativeImportPath(sourceFile, target);
  }
  if (importPath.startsWith("@/")) {
    const target = importPath.replace("@/", "src/");
    return relativeImportPath(sourceFile, target);
  }
  return importPath;
}

function relativeImportPath(fromFile, toTarget) {
  const fromDir = path.dirname(fromFile);
  const toFile = path.join(OUTDIR, toTarget + ".js");
  let rel = path.relative(fromDir, toFile);
  if (!rel.startsWith(".")) rel = "./" + rel;
  rel = rel.replace(/\\/g, "/");
  return rel;
}

function postProcessFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  
  // Fix static imports
  content = content.replace(
    /from\s+["']([^"']+)["']/g,
    (match, importPath) => {
      if (!importPath.startsWith("@") && /\.[a-zA-Z]+$/.test(importPath)) {
        return match;
      }
      let resolved = resolveAlias(importPath, filePath);
      if ((resolved.startsWith("./") || resolved.startsWith("../")) && !/\.[a-zA-Z]+$/.test(resolved)) {
        resolved += ".js";
      }
      if (resolved !== importPath) {
        return `from "${resolved}"`;
      }
      return match;
    }
  );
  
  // Fix dynamic imports
  content = content.replace(
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    (match, importPath) => {
      if (!importPath.startsWith("@") && /\.[a-zA-Z]+$/.test(importPath)) {
        return match;
      }
      let resolved = resolveAlias(importPath, filePath);
      if ((resolved.startsWith("./") || resolved.startsWith("../")) && !/\.[a-zA-Z]+$/.test(resolved)) {
        resolved += ".js";
      }
      if (resolved !== importPath) {
        return `import("${resolved}")`;
      }
      return match;
    }
  );
  
  fs.writeFileSync(filePath, content);
}

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.name.endsWith(".js")) {
      callback(fullPath);
    }
  }
}

walkDir(OUTDIR, postProcessFile);
console.log("Post-processing complete!");

// Step 4: Verify with Node --check
let errorCount = 0;
walkDir(OUTDIR, (filePath) => {
  const relPath = path.relative(OUTDIR, filePath);
  try {
    execSync(`node --check "${filePath}"`, { stdio: "pipe" });
  } catch (e) {
    console.error(`SYNTAX ERROR in ${relPath}:`);
    console.error(e.stderr?.toString() || e.message);
    errorCount++;
  }
});

if (errorCount === 0) {
  console.log("All files passed syntax check!");
} else {
  console.error(`${errorCount} files have syntax errors`);
  process.exit(1);
}

console.log(`\nBackend build complete! Output: ${OUTDIR}`);
console.log(`Entry point: ${path.join("dist", "server", "api", "boot.js")}`);
