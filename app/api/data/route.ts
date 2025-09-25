import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

// JSONBin.io を使用した無料のデータストレージ
const JSONBIN_BASE_URL = "https://api.jsonbin.io/v3/b";
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || "675ea851e41b4d34e4596e04"; // デフォルトのBin ID
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY || null;

const headers = {
  "Content-Type": "application/json",
  ...(JSONBIN_MASTER_KEY && { "X-Master-Key": JSONBIN_MASTER_KEY }),
};

// 初期データ
const initialData = {
  threads: [],
  userName: "",
  availableNames: ["山田太郎", "佐藤花子", "田中一郎", "鈴木美咲", "高橋健太"],
};

// GET: データを読み込み
export async function GET() {
  try {
    const response = await fetch(
      `${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}/latest`,
      {
        method: "GET",
        headers,
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data.record);
    } else {
      // Binが存在しない場合は初期データを返す
      console.warn("Bin not found, returning initial data");
      return NextResponse.json(initialData);
    }
  } catch (error) {
    console.error("Error reading data:", error);
    // エラーの場合も初期データを返す
    return NextResponse.json(initialData);
  }
}

// POST: データを保存
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      throw new Error(
        `HTTP ${response.status}: ${
          response.status === 401 ? "Invalid API key" : response.statusText
        }`
      );
    }
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

// PATCH: 名前を変更
export async function PATCH(request: NextRequest) {
  try {
    const { oldName, newName } = await request.json();

    // 現在のデータを取得
    const getResponse = await fetch(
      `${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}/latest`,
      {
        method: "GET",
        headers,
      }
    );

    let currentData;
    if (getResponse.ok) {
      const data = await getResponse.json();
      currentData = data.record;
    } else {
      currentData = initialData;
    }

    // 名前を更新
    const updatedData = {
      ...currentData,
      userName: newName,
      // スレッドとコメントの投稿者名も更新
      threads: currentData.threads.map((thread: any) => ({
        ...thread,
        author: thread.author === oldName ? newName : thread.author,
        comments: thread.comments.map((comment: any) => ({
          ...comment,
          author: comment.author === oldName ? newName : comment.author,
        })),
      })),
    };

    // データを保存
    const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updatedData),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, data: updatedData });
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error updating name:", error);
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 }
    );
  }
}

// DELETE: データを削除（管理者用）
export async function DELETE() {
  try {
    const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(initialData),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error clearing data:", error);
    return NextResponse.json(
      { error: "Failed to clear data" },
      { status: 500 }
    );
  }
}
