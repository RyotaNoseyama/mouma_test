"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MessageCircle,
  Users,
  ArrowLeft,
  Settings,
  Trash2,
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
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadDescription, setNewThreadDescription] = useState("");
  const [newComment, setNewComment] = useState("");
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

  // コメントの追加
  const handleAddComment = async (threadId: string) => {
    if (newComment.trim()) {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        author: localUserName,
        timestamp: new Date(),
      };

      const updatedThreads = appData.threads.map((thread) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            comments: [...thread.comments, newCommentObj],
          };
        }
        return thread;
      });

      const newData = { ...appData, threads: updatedThreads };
      await saveData(newData);
      setNewComment("");

      // selectedThread を更新
      const updatedThread = updatedThreads.find((t) => t.id === threadId);
      if (updatedThread) {
        setSelectedThread(updatedThread);
      }
    }
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                管理画面
              </h1>
              <p className="text-gray-600">システム管理機能</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdminPanel(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                データ管理
              </CardTitle>
              <CardDescription>
                システム内の全データを管理します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  現在のデータ状況
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 現在のユーザー: {localUserName || "未設定"}</li>
                  <li>
                    • 利用可能なユーザー名:{" "}
                    {(appData.availableNames || []).length}件
                  </li>
                  <li>• アイデアスレッド数: {appData.threads.length}件</li>
                  <li>
                    • 総コメント数:{" "}
                    {appData.threads.reduce(
                      (total, thread) => total + thread.comments.length,
                      0
                    )}
                    件
                  </li>
                  <li>
                    • 投稿者別スレッド数:{" "}
                    {
                      Array.from(new Set(appData.threads.map((t) => t.author)))
                        .length
                    }
                    人
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  ユーザー情報
                </h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>
                    <strong>利用可能なユーザー名:</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(appData.availableNames || []).map((name) => (
                      <div
                        key={name}
                        className="flex items-center justify-between bg-white p-2 rounded border"
                      >
                        <span>{name}</span>
                        {name === localUserName && (
                          <Badge variant="default" className="text-xs">
                            現在
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">
                  ⚠️ 危険な操作
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  以下の操作を実行すると、全てのデータが完全に削除されます。この操作は取り消すことができません。
                </p>
                <Button
                  variant="destructive"
                  onClick={handleClearAllData}
                  className="w-full"
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
  if (!selectedThread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                アイデア掲示板
              </h1>
              <p className="text-gray-600">
                ようこそ、{localUserName}さん
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewUserName(localUserName);
                    setShowChangeNameDialog(true);
                  }}
                  className="ml-2 h-auto p-1 text-xs"
                >
                  (変更)
                </Button>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminDialog(true)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                管理
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新しいアイデア
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {appData.threads.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">まだアイデアが投稿されていません</p>
                  <p className="text-sm">
                    最初のアイデアを投稿してみましょう！
                  </p>
                </div>
              </Card>
            ) : (
              appData.threads.map((thread) => (
                <Card
                  key={thread.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          {thread.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          投稿者: {thread.author}
                          {thread.author === localUserName && " (あなた)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        {thread.participants.length}
                      </div>
                    </div>
                    <CardDescription className="text-base mt-2">
                      {thread.description}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isAuthor(thread) ? "default" : "secondary"}
                      >
                        {isAuthor(thread) ? "あなたの投稿" : "他の人の投稿"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {thread.comments.length} コメント
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {!isParticipant(thread) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJoinThread(thread.id)}
                        >
                          参加する
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => setSelectedThread(thread)}
                        disabled={!isParticipant(thread)}
                      >
                        {isParticipant(thread)
                          ? "ディスカッションに参加"
                          : "参加が必要です"}
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ようこそ！</DialogTitle>
              <DialogDescription>
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
                disabled={
                  !isAddingNewName ? !selectedName : !tempUserName.trim()
                }
              >
                始める
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 管理者認証ダイアログ */}
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>管理者認証</DialogTitle>
              <DialogDescription>
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAdminDialog(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleAdminLogin}
                disabled={!adminPassword.trim()}
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>名前を変更</DialogTitle>
              <DialogDescription>
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowChangeNameDialog(false);
                  setNewUserName("");
                }}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleChangeName}
                disabled={
                  !newUserName.trim() || newUserName.trim() === localUserName
                }
              >
                変更する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 新規スレッド作成ダイアログ */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>新しいアイデアを投稿</DialogTitle>
              <DialogDescription>
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleCreateThread}
                disabled={
                  !newThreadTitle.trim() || !newThreadDescription.trim()
                }
              >
                投稿する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // スレッド詳細ビュー
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedThread(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedThread.title}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {selectedThread.participants.length}人が参加中
              </p>
              <p className="text-gray-600">
                投稿者: {selectedThread.author}
                {selectedThread.author === localUserName && " (あなた)"}
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">アイデア概要</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {selectedThread.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              ディスカッション ({selectedThread.comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full pr-4">
              {selectedThread.comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  まだコメントがありません。最初のコメントを投稿してみましょう！
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedThread.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {comment.author}
                          </span>
                          {comment.author === localUserName && (
                            <Badge variant="default" className="text-xs">
                              あなた
                            </Badge>
                          )}
                          {comment.author === selectedThread.author && (
                            <Badge variant="secondary" className="text-xs">
                              投稿者
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {comment.timestamp.toLocaleString("ja-JP")}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />

            <div className="space-y-3">
              <Label htmlFor="comment">コメントを投稿</Label>
              <div className="flex gap-2">
                <Textarea
                  id="comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="あなたの意見や質問を書いてください..."
                  rows={3}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleAddComment(selectedThread.id)}
                  disabled={!newComment.trim()}
                  className="self-end"
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
