import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const enabled = process.env.ENABLE_DEV_RUN_TESTS === "true";
    const secret = process.env.DEV_TOOLS_SECRET;

    if (!enabled || !secret) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const requestSecret = req.headers.get("x-dev-tools-secret");
    if (requestSecret !== secret) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

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
