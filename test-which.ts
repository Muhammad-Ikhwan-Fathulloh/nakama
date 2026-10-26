
import { join } from "path";
import { writeFile, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { which } from "bun";

async function testWhich() {
  const tempBinDir = await mkdir(join(tmpdir(), "nakama-test-which-"), { recursive: true });
  
  try {
    // Create codex.cmd
    const scriptPath = join(tempBinDir, "codex.cmd");
    await writeFile(scriptPath, `@echo off
if "%1" == "--version" (
  echo codex 0.1.0
  exit /b 0
)
echo OK
exit /b 0
`);

    console.log("Temp bin dir:", tempBinDir);
    process.env.PATH = tempBinDir;

    console.log("Which 'codex':", which("codex"));
    console.log("Which 'codex.cmd':", which("codex.cmd"));
    
  } finally {
    await rm(tempBinDir, { recursive: true, force: true });
  }
}

testWhich();
