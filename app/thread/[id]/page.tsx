"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  MessageCircle,
  Users,
  Plus,
  Sparkles,
  Star,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
}

interface Thread {
  id: string;
  title: string;
  description: string;
  author: string;
  participants: string[];
  comments: Comment[];
  createdAt: Date;
}

interface AppData {
  threads: Thread[];
  userName: string;
  availableNames?: string[];
}

// ローカルストレージのキー
const LOCAL_STORAGE_KEY = "mouma_user_name";

// ローカルストレージからユーザー名を取得
const getLocalUserName = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
  }
  return "";
};

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;

  const [thread, setThread] = useState<Thread | null>(null);
  const [newComment, setNewComment] = useState("");
  const [localUserName, setLocalUserNameState] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // データの読み込み
  useEffect(() => {
    const loadData = async () => {
      // ローカルストレージからユーザー名を取得
      const localName = getLocalUserName();
      setLocalUserNameState(localName);

      if (!localName) {
        // ユーザー名が設定されていない場合はトップページにリダイレクト
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/data");
        if (response.ok) {
          const parsedData: AppData = await response.json();
          // Date オブジェクトを復元
          parsedData.threads = parsedData.threads.map((thread: any) => ({
            ...thread,
            createdAt: new Date(thread.createdAt),
            comments: thread.comments.map((comment: any) => ({
              ...comment,
              timestamp: new Date(comment.timestamp),
            })),
          }));

          // 指定されたIDのスレッドを探す
          const foundThread = parsedData.threads.find((t) => t.id === threadId);
          if (foundThread) {
            setThread(foundThread);

            // 参加していない場合はトップページにリダイレクト
            if (!foundThread.participants.includes(localName)) {
              router.push("/");
              return;
            }
          } else {
            // スレッドが見つからない場合はトップページにリダイレクト
            router.push("/");
            return;
          }
        } else {
          console.error("Failed to load data");
          router.push("/");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [threadId, router]);

  // データの保存
  const saveData = async (data: AppData) => {
    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // データ更新後、現在のスレッドを更新
        const updatedThread = data.threads.find((t) => t.id === threadId);
        if (updatedThread) {
          setThread(updatedThread);
        }
      } else {
        console.error("Failed to save data");
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // コメントの追加
  const handleAddComment = async () => {
    if (!newComment.trim() || !thread) return;

    try {
      const response = await fetch("/api/data");
      if (response.ok) {
        const currentData: AppData = await response.json();
        // Date オブジェクトを復元
        currentData.threads = currentData.threads.map((thread: any) => ({
          ...thread,
          createdAt: new Date(thread.createdAt),
          comments: thread.comments.map((comment: any) => ({
            ...comment,
            timestamp: new Date(comment.timestamp),
          })),
        }));

        const newCommentObj: Comment = {
          id: Date.now().toString(),
          content: newComment.trim(),
          author: localUserName,
          timestamp: new Date(),
        };

        const updatedThreads = currentData.threads.map((t) => {
          if (t.id === threadId) {
            return {
              ...t,
              comments: [...t.comments, newCommentObj],
            };
          }
          return t;
        });

        const newData = { ...currentData, threads: updatedThreads };
        await saveData(newData);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">スレッドが見つかりません</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            トップページに戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-8 left-8 sm:top-16 sm:left-16 w-18 h-18 sm:w-28 sm:h-28 md:w-36 md:h-36 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-12 right-12 sm:bottom-24 sm:right-24 w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 bg-purple-200 rounded-full opacity-25 animate-bounce"></div>
      <div
        className="absolute top-1/2 left-1/5 sm:left-1/4 w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-indigo-200 rounded-full opacity-30 animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>

      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 border-2 hover:bg-blue-50 transition-all duration-300 hover:scale-105 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            スレッド一覧に戻る
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-start sm:items-center gap-2 sm:gap-3 break-words">
              <Star className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600 animate-pulse flex-shrink-0 mt-1 sm:mt-0" />
              <span className="break-words">{thread.title}</span>
            </h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2">
              <p className="text-gray-700 flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                <Users className="w-4 h-4 text-blue-600" />
                {thread.participants.length}人が参加中
              </p>
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                <span className="text-gray-700">投稿者: {thread.author}</span>
                {thread.author === localUserName && (
                  <Badge
                    variant="default"
                    className="text-xs bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    あなた
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="mb-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              アイデア概要
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 leading-relaxed text-base">
              {thread.description}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 animate-pulse" />
              ディスカッション ({thread.comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-64 sm:h-80 md:h-96 w-full pr-2 sm:pr-4">
              {thread.comments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400 animate-bounce" />
                  <p className="text-gray-500 text-base sm:text-lg font-medium px-4">
                    まだコメントがありません。最初のコメントを投稿してみましょう！
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {thread.comments.map((comment) => {
                    // スレッドの投稿者が自分かどうかを判定
                    const isThreadOwner = thread.author === localUserName;

                    // コメントの表示名とバッジを決定
                    let displayName = "";
                    let badges = [];

                    if (isThreadOwner) {
                      // スレッド投稿者が自分の場合：全員の名前が見える
                      displayName = comment.author;
                      if (comment.author === localUserName) {
                        badges.push(
                          <Badge
                            key="you"
                            variant="default"
                            className="text-xs"
                          >
                            あなた
                          </Badge>
                        );
                      }
                    } else {
                      // スレッド投稿者が自分でない場合：条件付きで表示
                      if (comment.author === localUserName) {
                        // 自分のコメント
                        displayName = "あなた";
                      } else if (comment.author === thread.author) {
                        // 投稿者のコメント
                        displayName = "投稿者";
                      } else {
                        // その他の人のコメント：名前を隠す
                        displayName = "匿名ユーザー";
                      }
                    }

                    return (
                      <div
                        key={comment.id}
                        className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-blue-300"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              {displayName}
                            </span>
                            {badges}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                            {comment.timestamp.toLocaleString("ja-JP")}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
                          {comment.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-6" />

            <div className="space-y-4">
              <Label
                htmlFor="comment"
                className="text-base sm:text-lg font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                コメントを投稿
              </Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Textarea
                  id="comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="あなたの意見や質問を書いてください..."
                  rows={3}
                  className="flex-1 border-2 focus:border-blue-400 transition-all duration-300 text-sm sm:text-base"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="sm:self-end bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto"
                >
                  投稿
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
