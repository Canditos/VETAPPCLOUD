import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    // Apenas corre em ambiente não-produção (por segurança)
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: false, error: "Not allowed in production" }, { status: 403 });
    }

    // Executa os testes do playwright de forma headless e limpa a consola depois
    const { stdout, stderr } = await execPromise("npx playwright test");
    
    return NextResponse.json({ 
      success: true, 
      output: stdout,
      errors: stderr
    });
  } catch (error: any) {
    console.error("Playwright test execution failed:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to execute tests",
      output: error.stdout,
      errors: error.stderr
    }, { status: 500 });
  }
}
