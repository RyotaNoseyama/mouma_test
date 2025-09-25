import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

const DATA_FILE_PATH = join(process.cwd(), "data", "ideaBoardData.json");

// データファイルが存在しない場合は作成
function ensureDataFile() {
  const dataDir = dirname(DATA_FILE_PATH);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  if (!existsSync(DATA_FILE_PATH)) {
    const initialData = {
      threads: [],
      userName: "",
    };
    writeFileSync(DATA_FILE_PATH, JSON.stringify(initialData, null, 2));
  }
}

// GET: データを読み込み
export async function GET() {
  try {
    ensureDataFile();
    const data = readFileSync(DATA_FILE_PATH, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading data:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

// POST: データを保存
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    ensureDataFile();
    writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

// DELETE: データを削除（管理者用）
export async function DELETE() {
  try {
    const initialData = {
      threads: [],
      userName: "",
    };
    ensureDataFile();
    writeFileSync(DATA_FILE_PATH, JSON.stringify(initialData, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing data:", error);
    return NextResponse.json(
      { error: "Failed to clear data" },
      { status: 500 }
    );
  }
}
