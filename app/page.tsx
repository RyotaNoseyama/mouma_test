"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MessageCircle,
  Users,
  ArrowLeft,
  Settings,
  Trash2,
  Sparkles,
  Heart,
  Star,
  Zap,
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

// ローカルストレージにユーザー名を保存
const setLocalUserName = (name: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, name);
  }
};

export default function Home() {
  const router = useRouter();
  const [appData, setAppData] = useState<AppData>({
    threads: [],
    userName: "",
    availableNames: [],
  });
  const [localUserName, setLocalUserNameState] = useState<string>("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadDescription, setNewThreadDescription] = useState("");

  const [tempUserName, setTempUserName] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isAddingNewName, setIsAddingNewName] = useState(false);
  const [showChangeNameDialog, setShowChangeNameDialog] = useState(false);
  const [newUserName, setNewUserName] = useState("");

  // データの読み込み
  useEffect(() => {
    const loadData = async () => {
      // ローカルストレージからユーザー名を取得
      const localName = getLocalUserName();
      setLocalUserNameState(localName);

      try {
        const response = await fetch("/api/data");
        if (response.ok) {
          const parsedData = await response.json();
          // Date オブジェクトを復元
          parsedData.threads = parsedData.threads.map((thread: any) => ({
            ...thread,
            createdAt: new Date(thread.createdAt),
            comments: thread.comments.map((comment: any) => ({
              ...comment,
              timestamp: new Date(comment.timestamp),
            })),
          }));
          setAppData(parsedData);

          // ローカルストレージに名前がない場合のみダイアログ表示
          if (!localName) {
            setShowNameDialog(true);
          }
        } else {
          console.error("Failed to load data");
          setShowNameDialog(true);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setShowNameDialog(true);
      }
    };

    loadData();
  }, []);

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
        setAppData(data);
      } else {
        console.error("Failed to save data");
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // 名前の設定
  const handleSetName = async () => {
    let nameToSet = "";

    if (isAddingNewName && tempUserName.trim()) {
      nameToSet = tempUserName.trim();
    } else if (selectedName) {
      nameToSet = selectedName;
    }

    if (nameToSet) {
      // ローカルストレージに保存
      setLocalUserName(nameToSet);
      setLocalUserNameState(nameToSet);

      const updatedAvailableNames = appData.availableNames || [];
      if (!updatedAvailableNames.includes(nameToSet)) {
        updatedAvailableNames.push(nameToSet);
      }

      const newData = {
        ...appData,
        availableNames: updatedAvailableNames,
      };
      await saveData(newData);
      setShowNameDialog(false);
      setTempUserName("");
      setSelectedName("");
      setIsAddingNewName(false);
    }
  };

  // 管理者認証
  const handleAdminLogin = () => {
    if (adminPassword === "12345") {
      setShowAdminDialog(false);
      setShowAdminPanel(true);
      setAdminPassword("");
    } else {
      alert("パスワードが間違っています");
      setAdminPassword("");
    }
  };

  // 名前変更
  const handleChangeName = async () => {
    if (newUserName.trim() && newUserName.trim() !== localUserName) {
      // ローカルストレージを更新
      setLocalUserName(newUserName.trim());
      setLocalUserNameState(newUserName.trim());

      // 利用可能な名前のリストに追加
      const updatedAvailableNames = appData.availableNames || [];
      if (!updatedAvailableNames.includes(newUserName.trim())) {
        updatedAvailableNames.push(newUserName.trim());
      }

      const newData = {
        ...appData,
        availableNames: updatedAvailableNames,
      };
      await saveData(newData);

      setShowChangeNameDialog(false);
      setNewUserName("");
    }
  };

  // 全データ削除
  const handleClearAllData = async () => {
    if (
      confirm("本当に全てのデータを削除しますか？この操作は取り消せません。")
    ) {
      try {
        const response = await fetch("/api/data", {
          method: "DELETE",
        });

        if (response.ok) {
          setAppData({ threads: [], userName: "", availableNames: [] });
          // ローカルストレージもクリア
          setLocalUserName("");
          setLocalUserNameState("");
          setShowAdminPanel(false);
          setShowNameDialog(true);
        } else {
          console.error("Failed to clear data");
        }
      } catch (error) {
        console.error("Error clearing data:", error);
      }
    }
  };

  // 新しいスレッドの作成
  const handleCreateThread = async () => {
    if (newThreadTitle.trim() && newThreadDescription.trim()) {
      const newThread: Thread = {
        id: Date.now().toString(),
        title: newThreadTitle.trim(),
        description: newThreadDescription.trim(),
        author: localUserName,
        participants: [localUserName],
        comments: [],
        createdAt: new Date(),
      };

      const newData = {
        ...appData,
        threads: [newThread, ...appData.threads],
      };

      await saveData(newData);
      setShowCreateDialog(false);
      setNewThreadTitle("");
      setNewThreadDescription("");
    }
  };

  // スレッドへの参加
  const handleJoinThread = async (threadId: string) => {
    const updatedThreads = appData.threads.map((thread) => {
      if (
        thread.id === threadId &&
        !thread.participants.includes(localUserName)
      ) {
        return {
          ...thread,
          participants: [...thread.participants, localUserName],
        };
      }
      return thread;
    });

    await saveData({ ...appData, threads: updatedThreads });
  };

  const isParticipant = (thread: Thread) => {
    return thread.participants.includes(localUserName);
  };

  const isAuthor = (thread: Thread) => {
    return thread.author === localUserName;
  };

  // 管理画面ビュー
  if (showAdminPanel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-100 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-5 left-5 sm:top-10 sm:left-10 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-red-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-12 h-12 sm:w-18 sm:h-18 md:w-24 md:h-24 bg-orange-200 rounded-full opacity-30 animate-bounce"></div>
        <div
          className="absolute top-1/2 left-1/4 sm:left-1/3 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-pink-200 rounded-full opacity-25 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="container mx-auto px-4 py-4 md:py-8 max-w-2xl relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2 flex items-center gap-2 sm:gap-3">
                <Settings
                  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-red-600 animate-spin"
                  style={{ animationDuration: "3s" }}
                />
                管理画面
              </h1>
              <p className="text-gray-700 text-base sm:text-lg font-medium">
                システム管理機能
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdminPanel(false)}
              className="flex items-center gap-2 border-2 hover:bg-red-50 transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </Button>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <Trash2 className="w-5 h-5 animate-pulse" />
                データ管理
              </CardTitle>
              <CardDescription className="text-red-100">
                システム内の全データを管理します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-md">
                <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  現在のデータ状況
                </h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    現在のユーザー:{" "}
                    <span className="font-medium">
                      {localUserName || "未設定"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    利用可能なユーザー名:{" "}
                    <span className="font-medium">
                      {(appData.availableNames || []).length}件
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    アイデアスレッド数:{" "}
                    <span className="font-medium">
                      {appData.threads.length}件
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    総コメント数:{" "}
                    <span className="font-medium">
                      {appData.threads.reduce(
                        (total, thread) => total + thread.comments.length,
                        0
                      )}
                      件
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    投稿者別スレッド数:{" "}
                    <span className="font-medium">
                      {
                        Array.from(
                          new Set(appData.threads.map((t) => t.author))
                        ).length
                      }
                      人
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-lg p-4 mb-4 shadow-md">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  ユーザー情報
                </h3>
                <div className="text-sm text-blue-700 space-y-3">
                  <p className="font-medium">利用可能なユーザー名:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(appData.availableNames || []).map((name) => (
                      <div
                        key={name}
                        className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-3 rounded-lg border hover:shadow-md transition-all duration-300 hover:scale-105"
                      >
                        <span className="font-medium text-sm sm:text-base">
                          {name}
                        </span>
                        {name === localUserName && (
                          <Badge
                            variant="default"
                            className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500"
                          >
                            現在
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 animate-pulse" />
                  ⚠️ 危険な操作
                </h3>
                <p className="text-sm text-red-700 mb-4 leading-relaxed">
                  以下の操作を実行すると、全てのデータが完全に削除されます。この操作は取り消すことができません。
                </p>
                <Button
                  variant="destructive"
                  onClick={handleClearAllData}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  全データを削除する
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  // スレッド一覧ビュー
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-16 right-16 sm:bottom-32 sm:right-32 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-purple-200 rounded-full opacity-25 animate-bounce"></div>
      <div
        className="absolute top-1/3 right-1/5 sm:right-1/4 w-12 h-12 sm:w-18 sm:h-18 md:w-24 md:h-24 bg-indigo-200 rounded-full opacity-30 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute bottom-10 left-1/4 sm:bottom-20 sm:left-1/3 w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-pink-200 rounded-full opacity-20 animate-bounce"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4">
          <div className="w-full lg:w-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-2 sm:gap-3 lg:gap-4">
              <Sparkles
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-blue-600 animate-spin"
                style={{ animationDuration: "4s" }}
              />
              アイデア掲示板
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <p className="text-gray-700 text-base sm:text-lg font-medium flex items-center gap-2">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 animate-pulse" />
                ようこそ、
                <span className="font-bold text-blue-700">{localUserName}</span>
                さん
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewUserName(localUserName);
                  setShowChangeNameDialog(true);
                }}
                className="h-auto p-2 text-xs hover:bg-blue-100 transition-all duration-300 rounded-full w-fit"
              >
                (変更)
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdminDialog(true)}
              className="flex items-center justify-center gap-2 border-2 hover:bg-blue-50 transition-all duration-300 hover:scale-105"
            >
              <Settings className="w-4 h-4" />
              管理
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新しいアイデア</span>
              <span className="sm:hidden">アイデア投稿</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {appData.threads.length === 0 ? (
            <Card className="p-6 sm:p-8 md:p-12 text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
              <div className="text-gray-600">
                <div className="relative mb-4 sm:mb-6">
                  <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto opacity-30 animate-bounce" />
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-yellow-500 animate-pulse" />
                </div>
                <p className="text-lg sm:text-xl font-semibold mb-2">
                  まだアイデアが投稿されていません
                </p>
                <p className="text-sm sm:text-base text-gray-500">
                  最初のアイデアを投稿してみましょう！
                </p>
              </div>
            </Card>
          ) : (
            appData.threads.map((thread) => (
              <Card
                key={thread.id}
                className="hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white/90 backdrop-blur-sm hover:scale-105 transform group"
              >
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl flex items-start sm:items-center gap-2 break-words">
                        <Star className="w-5 h-5 animate-pulse flex-shrink-0 mt-0.5 sm:mt-0" />
                        <span className="break-words">{thread.title}</span>
                      </CardTitle>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                        <span className="text-blue-100 text-sm sm:text-base">
                          投稿者: {thread.author}
                        </span>
                        {thread.author === localUserName && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-white/20 text-white w-fit"
                          >
                            あなた
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-100 bg-white/20 px-3 py-1 rounded-full flex-shrink-0">
                      <Users className="w-4 h-4" />
                      {thread.participants.length}
                    </div>
                  </div>
                  <CardDescription className="text-blue-50 text-sm sm:text-base mt-3 leading-relaxed break-words">
                    {thread.description}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <Badge
                      variant={isAuthor(thread) ? "default" : "secondary"}
                      className={
                        isAuthor(thread)
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : ""
                      }
                    >
                      <span className="hidden sm:inline">
                        {isAuthor(thread) ? "あなたの投稿" : "他の人の投稿"}
                      </span>
                      <span className="sm:hidden">
                        {isAuthor(thread) ? "あなた" : "他の人"}
                      </span>
                    </Badge>
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {thread.comments.length} コメント
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    {!isParticipant(thread) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJoinThread(thread.id)}
                        className="hover:bg-blue-50 transition-all duration-300 border-2 hover:scale-105 w-full sm:w-auto"
                      >
                        参加する
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (isParticipant(thread)) {
                          router.push(`/thread/${thread.id}`);
                        }
                      }}
                      disabled={!isParticipant(thread)}
                      className={
                        isParticipant(thread)
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                          : "w-full sm:w-auto"
                      }
                    >
                      <span className="hidden sm:inline">
                        {isParticipant(thread)
                          ? "ディスカッションに参加"
                          : "参加が必要です"}
                      </span>
                      <span className="sm:hidden">
                        {isParticipant(thread) ? "参加" : "参加必要"}
                      </span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 名前入力ダイアログ */}
      <Dialog open={showNameDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-[95vw] sm:max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 animate-pulse" />
              ようこそ！
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
              アイデア掲示板を利用するために、お名前を選択するか新しい名前を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!isAddingNewName && (
              <div className="grid gap-2">
                <Label>既存の名前から選択</Label>
                <Select value={selectedName} onValueChange={setSelectedName}>
                  <SelectTrigger>
                    <SelectValue placeholder="名前を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {(appData.availableNames || []).map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNewName(true)}
                  className="mt-2"
                >
                  新しい名前を追加
                </Button>
              </div>
            )}

            {isAddingNewName && (
              <div className="grid gap-2">
                <Label htmlFor="name">新しいお名前</Label>
                <Input
                  id="name"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  placeholder="山田太郎"
                  onKeyPress={(e) => e.key === "Enter" && handleSetName()}
                  className="border-2 focus:border-blue-400 transition-all duration-300"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingNewName(false);
                    setTempUserName("");
                  }}
                  className="mt-2"
                >
                  既存の名前から選択に戻る
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleSetName}
              disabled={!isAddingNewName ? !selectedName : !tempUserName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <Heart className="w-4 h-4 mr-2" />
              始める
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 管理者認証ダイアログ */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-red-50">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Settings
                className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 animate-spin"
                style={{ animationDuration: "3s" }}
              />
              管理者認証
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600">
              管理画面にアクセスするためのパスワードを入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="パスワードを入力"
                onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                className="border-2 focus:border-red-400 transition-all duration-300"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdminDialog(false)}
              className="flex-1 hover:bg-gray-100 transition-all duration-300"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAdminLogin}
              disabled={!adminPassword.trim()}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
            >
              ログイン
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 名前変更ダイアログ */}
      <Dialog
        open={showChangeNameDialog}
        onOpenChange={setShowChangeNameDialog}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-green-50">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 animate-pulse" />
              名前を変更
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
              新しい名前を入力してください。今後の投稿やコメントにこの名前が使用されます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newName">新しい名前</Label>
              <Input
                id="newName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="新しい名前を入力"
                onKeyPress={(e) => e.key === "Enter" && handleChangeName()}
                className="border-2 focus:border-green-400 transition-all duration-300"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeNameDialog(false);
                setNewUserName("");
              }}
              className="flex-1 hover:bg-gray-100 transition-all duration-300"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleChangeName}
              disabled={
                !newUserName.trim() || newUserName.trim() === localUserName
              }
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              変更する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新規スレッド作成ダイアログ */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 animate-pulse" />
              <span className="hidden sm:inline">新しいアイデアを投稿</span>
              <span className="sm:hidden">アイデア投稿</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
              あなたのアイデアを共有して、興味のある人と一緒に深掘りしましょう。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">アイデアのタイトル</Label>
              <Input
                id="title"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="例: 地域コミュニティを活性化するアプリ"
                className="border-2 focus:border-purple-400 transition-all duration-300"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">アイデアの概要</Label>
              <Textarea
                id="description"
                value={newThreadDescription}
                onChange={(e) => setNewThreadDescription(e.target.value)}
                placeholder="アイデアの詳細、解決したい課題、期待する効果などを書いてください..."
                rows={4}
                className="border-2 focus:border-purple-400 transition-all duration-300"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="flex-1 hover:bg-gray-100 transition-all duration-300"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCreateThread}
              disabled={!newThreadTitle.trim() || !newThreadDescription.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              投稿する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
