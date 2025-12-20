import { Environment, Gltf } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import type { Item } from "common/generate/adventSphereAPI.schemas";
import {
  useGetCalendarItemsRoomIdCalendarItems,
  usePatchCalendarItemsRoomIdCalendarItemsId,
  usePostCalendarItemsRoomIdCalendarItems,
  usePostCalendarItemsUploadPhoto,
} from "common/generate/calendar-items/calendar-items";
import {
  useGetRoomsId,
  useGetRoomsIdIsPasswordProtected,
  usePostRoomsIdVerifyPassword,
} from "common/generate/room/room";
import { Check, Copy, Eye } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { R2_BASE_URL } from "@/constants/r2-url";
import { useUser } from "@/context/UserContext";
import AiGenerationScreen from "@/features/edit/AiGenerationScreen";
import ChangeItemDialog from "@/features/edit/changeItem";
import ItemSelectDialog from "@/features/edit/itemSelectDialog";
import UploadImg from "@/features/edit/uploadImg";
import Calendar from "@/features/room/calendar";
import PasswordInput from "@/features/room/passwordInput";
import NameInput from "@/features/user/nameInput";

export const Route = createLazyFileRoute("/$roomId/$editId")({
  component: RouteComponent,
});

// カメラをカレンダーの正面に配置するコンポーネント（フォーカスモードと同じロジック）
function CameraSetup({
  calendarRef,
}: {
  calendarRef: React.RefObject<Group | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!calendarRef.current) return;

      // カレンダーのバウンディングボックスを計算
      const box = new THREE.Box3().setFromObject(calendarRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // 画面のアスペクト比を取得
      const aspect = window.innerWidth / window.innerHeight;

      // カレンダーの高さ・幅に基づいて必要な距離を計算
      // FOV 50度を想定
      const fov = 50 * (Math.PI / 180);
      const calendarHeight = size.y;
      const calendarWidth = size.z;

      // 縦横それぞれで必要な距離を計算し、大きい方を採用
      const distanceForHeight = calendarHeight / (2 * Math.tan(fov / 2));
      const distanceForWidth = calendarWidth / (2 * Math.tan(fov / 2) * aspect);
      const distance = Math.max(distanceForHeight, distanceForWidth) * 0.9;

      // カメラをカレンダーの正面に配置（フォーカスモードと同じ）
      camera.position.set(
        center.x + distance,
        center.y + 0.05,
        center.z - 0.05,
      );
      camera.lookAt(center.x, center.y + 0.02, center.z - 0.05);
    }, 100);

    return () => clearTimeout(timer);
  }, [camera, calendarRef]);

  return null;
}

function RouteComponent() {
  const { roomId, editId } = Route.useParams();
  const calendarRef = useRef<Group>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChangeMode, setIsChangeMode] = useState(false);
  const [openedDrawers, setOpenedDrawers] = useState<number[]>([]);
  const [isAiGenerationOpen, setIsAiGenerationOpen] = useState(false);
  const [isUploadImgOpen, setIsUploadImgOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/${roomId}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // ローカルでパスワード認証を管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();

  // コンポーネント初期化時に認証状態を復元
  useEffect(() => {
    const savedAuth = sessionStorage.getItem(`auth_${roomId}`);
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, [roomId]);

  const { user } = useUser();

  // パスワード保護状態をチェック
  const { data: passwordProtectionData, isLoading: isCheckingProtection } =
    useGetRoomsIdIsPasswordProtected(roomId, {
      query: {
        enabled: !!roomId,
        retry: false,
      },
    });

  // パスワード保護されているかどうかの状態
  const isPasswordProtected =
    passwordProtectionData?.isPasswordProtected ?? null;
  const passwordLoading = isCheckingProtection;

  // ユーザーが作成された場合、認証状態を保持
  useEffect(() => {
    // パスワード保護されている場合のみ、ユーザー作成後も認証状態を保持
    if (isPasswordProtected === true && user && !isAuthenticated) {
      // 既に認証が成功していた場合（認証→ユーザー作成の流れ）は認証状態を保持
      // この場合、ローカルストレージなどに認証フラグを保存することも可能
      const wasAuthenticated = sessionStorage.getItem(`auth_${roomId}`);
      if (wasAuthenticated === "true") {
        setIsAuthenticated(true);
      }
    }
  }, [user, isPasswordProtected, roomId, isAuthenticated]);

  // パスワード認証
  const { mutateAsync: verifyPassword, isPending: isVerifyingPassword } =
    usePostRoomsIdVerifyPassword();

  // パスワード送信処理
  const sendPassword = async (password: string) => {
    try {
      setPasswordError(undefined); // エラーをクリア
      await verifyPassword({
        id: roomId,
        data: { password },
      });
      console.log("Password verified successfully");
      setIsAuthenticated(true); // 認証状態をセッションストレージに保存
      sessionStorage.setItem(`auth_${roomId}`, "true");
    } catch (error) {
      console.error("Password verification failed:", error);
      setPasswordError("合言葉が間違っています。再度入力してください。");
    }
  };

  const handlePasswordErrorDismiss = () => {
    setPasswordError(undefined);
  };

  const handleUploadImgBack = () => {
    setIsUploadImgOpen(false);
    setSelectedItem(null);
    setIsDialogOpen(true); // アイテム選択ダイアログを再度開く
  };

  const handleUploadImgAiGenerate = () => {
    setIsUploadImgOpen(false);
    setIsAiGenerationOpen(true);
  };

  const convertBase64ToImage = async (base64: string) => {
    const blob = atob(base64.replace(/^.*,/, ""));
    const buffer = new Uint8Array(blob.length);
    for (let i = 0; i < blob.length; i++) {
      buffer[i] = blob.charCodeAt(i);
    }
    return new File([buffer.buffer], "image.png", { type: "image/png" });
  };

  const handleUploadImgFileUpload = async (file: File) => {
    if (!room || !selectedItem || !selectedDay || !user) return;

    try {
      setIsUploading(true);
      console.log("Uploading file:", file.name);

      // 画像をアップロード
      const uploadResult = await uploadPhoto({
        data: { photo: file },
      });

      console.log("Upload successful, imageId:", uploadResult.imageId);

      // カレンダーアイテムを作成（画像IDを含む）
      const startAt = new Date(room.startAt);
      const openDate = new Date(
        startAt.setDate(startAt.getDate() + selectedDay - 1),
      );

      await postCalendarItem({
        roomId,
        data: {
          editId,
          calendarItem: {
            userId: user.id,
            roomId,
            openDate: openDate.toISOString(),
            itemId: selectedItem.id,
            imageId: uploadResult.imageId, // アップロードした画像IDを設定
          },
        },
      });

      await refetch();
      setShowUploadSuccess(true); // 成功ダイアログを表示
      setIsUploadImgOpen(false);
      setSelectedItem(null);
      handleDialogClose(false);
    } catch (error) {
      console.error("Upload failed:", error);
      // エラーハンドリング（必要に応じてユーザーに通知）
    } finally {
      setIsUploading(false);
    }
  };

  const { data: room } = useGetRoomsId(roomId);
  const { data: calendarItems, refetch } =
    useGetCalendarItemsRoomIdCalendarItems(roomId);

  const { mutateAsync: postCalendarItem } =
    usePostCalendarItemsRoomIdCalendarItems();

  // ■ 更新用APIの初期化
  const { mutateAsync: updateCalendarItem } =
    usePatchCalendarItemsRoomIdCalendarItemsId();

  const { mutateAsync: uploadPhoto } = usePostCalendarItemsUploadPhoto();

  // ルームIDは既にuseParamsで取得されているため、特別な設定は不要

  // calendarItemsから埋まっている日付とユーザー名のマップを計算
  const { filledDays, filledDayUserNames } = useMemo(() => {
    if (!calendarItems || !room)
      return {
        filledDays: [],
        filledDayUserNames: {} as Record<number, string>,
      };

    const startDate = new Date(room.startAt);
    const days: number[] = [];
    const userNames: Record<number, string> = {};

    for (const item of calendarItems) {
      const openDate = new Date(item.openDate);
      // startDateからopenDateまでの日数を計算（1始まり）
      const diffTime = openDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      days.push(diffDays);
      userNames[diffDays] = item.userName;
    }

    return { filledDays: days, filledDayUserNames: userNames };
  }, [calendarItems, room]);

  // 選択された日のアイテム情報を安全に計算
  const targetCalendarItem = useMemo(() => {
    if (!room || !calendarItems || selectedDay === null) {
      return null;
    }

    const startDate = new Date(room.startAt);

    return calendarItems.find((calendarItem) => {
      const openDate = new Date(calendarItem.openDate);
      const diffTime = openDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays === selectedDay;
    });
  }, [room, calendarItems, selectedDay]);

  const handleDayClick = (day: number) => {
    const drawerIndex = day - 1;
    setSelectedDay(day);
    setIsDialogOpen(true);
    // 引き出しを開く
    setOpenedDrawers([drawerIndex]);
  };

  const handleItemSelect = async (item: Item) => {
    console.log(`Day ${selectedDay} selected item:`, item.id);
    if (!room) return;

    if (item.type === "photo_frame") {
      setSelectedItem(item);
      setIsUploadImgOpen(true);
      return; // フォトフレームの場合は画像選択画面を表示してリターン
    }

    const startAt = new Date(room.startAt);
    const openDate = new Date(
      startAt.setDate(startAt.getDate() + (selectedDay ?? 0) - 1),
    );

    if (targetCalendarItem) {
      try {
        console.log("Updating existing item:", targetCalendarItem.id);
        await updateCalendarItem({
          roomId,
          id: targetCalendarItem.id, // カレンダーアイテムのIDを指定
          data: {
            editId,
            calendarItem: {
              itemId: item.id, // 新しいアイテムIDで更新
              // 必要に応じて他のフィールドも更新（例: 画像をリセットする場合は imageId: null など）
            },
          },
        });
      } catch (error) {
        console.error("Update failed:", error);
      }
    } else {
      // アイテムがない場合 -> POST (新規作成)
      try {
        console.log("Creating new item");
        await postCalendarItem({
          roomId,
          data: {
            editId,
            calendarItem: {
              userId: user?.id ?? "",
              roomId,
              openDate: openDate.toISOString(),
              itemId: item.id,
            },
          },
        });
      } catch (error) {
        console.error("Creation failed:", error);
      }
    }

    await refetch();
    handleDialogClose(false);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // ダイアログが閉じられたら引き出しも閉じる
      setOpenedDrawers([]);
    }
  };

  // パスワード認証のローディング中
  if (passwordLoading) {
    return <Loading text="認証確認中..." />;
  }

  // パスワード保護状態が未確定の場合
  if (isPasswordProtected === null) {
    return <Loading text="ルーム情報確認中..." />;
  }

  // パスワード保護されていて認証されていない場合
  if (isPasswordProtected === true && !isAuthenticated) {
    return (
      <PasswordInput
        onSubmit={sendPassword}
        isLoading={isVerifyingPassword}
        error={passwordError}
        onErrorDismiss={handlePasswordErrorDismiss}
      />
    );
  }

  // ユーザーが存在しない場合
  if (!user) {
    return <NameInput />;
  }

  // 認証完了または不要な場合、編集画面を表示
  return (
    <div className="w-full h-svh flex">
      {/* 閲覧画面への遷移ボタン */}

      <div className="absolute top-4 right-4 z-50 rounded-md flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-primary hover:bg-green-700 text-white hover:text-white text-lg"
          onClick={handleCopyUrl}
        >
          {isCopied ? (
            <Check className="w-5 h-5 mr-2" />
          ) : (
            <Copy className="w-5 h-5 mr-2" />
          )}
          {isCopied ? "コピーしました" : "URLをコピー"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary hover:bg-green-700  text-white hover:text-white text-lg"
          asChild
        >
          <Link to="/$roomId" params={{ roomId }} target="_blank">
            <Eye className="w-6 h-6 mr-2" />
            閲覧画面へ
          </Link>
        </Button>
      </div>

      {/* 3Dオブジェクト */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<Loading text="読み込み中..." />}>
          <Canvas camera={{ position: [1, 0, 0], fov: 50 }}>
            <ambientLight intensity={0.15} />
            <Environment preset="apartment" environmentIntensity={0.2} />
            <directionalLight
              position={[2, 1.5, -0.5]}
              intensity={3.6}
              target-position={[0, 0, 0]}
            />

            <Gltf
              src={`${R2_BASE_URL}/static/room.glb`}
              position={[0, -0.8, 0]}
            />
            <Gltf
              src={`${R2_BASE_URL}/static/table%20(1).glb`}
              position={[0, -0.5, 0]}
              scale={6}
            />
            <Calendar
              groupRef={calendarRef}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              isFocusMode={true}
              onCalendarClick={() => {}}
              onDayClick={handleDayClick}
              openedDrawers={openedDrawers}
              onOpenedDrawersChange={setOpenedDrawers}
              filledDays={filledDays}
              filledDayUserNames={filledDayUserNames}
              isAnonymous={room?.isAnonymous ?? true}
            />
            <CameraSetup calendarRef={calendarRef} />
          </Canvas>
        </Suspense>
      </div>

      {/* アイテム選択または変更ダイアログ */}
      {selectedDay !== null &&
        (filledDays.includes(selectedDay) &&
        targetCalendarItem &&
        !isChangeMode ? (
          <ChangeItemDialog
            open={isDialogOpen}
            onOpenChange={handleDialogClose}
            day={selectedDay}
            // 型エラー回避: CalendarItemWithItemAllOfItemをItem型へ変換（最低限のプロパティのみ渡す）
            item={{
              id: targetCalendarItem.item.id,
              name: targetCalendarItem.item.name,
              type: targetCalendarItem.item.type,
              createdAt: "",
              description: "",
            }}
            onChange={() => {
              setIsChangeMode(true);
            }}
          />
        ) : (
          <ItemSelectDialog
            open={isDialogOpen}
            onOpenChange={handleDialogClose}
            day={selectedDay}
            onSelect={(item) => {
              handleItemSelect(item);
              setIsChangeMode(false);
            }}
          />
        ))}

      {/* アップロード成功ダイアログ */}
      <Dialog open={showUploadSuccess} onOpenChange={setShowUploadSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-primary">
              画像のアップロードに成功しました！
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              フォトフレームに画像が設定されました。
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setShowUploadSuccess(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isUploadImgOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <UploadImg
            onBack={handleUploadImgBack}
            onAiGenerate={handleUploadImgAiGenerate}
            onFileUpload={handleUploadImgFileUpload}
            item={selectedItem || undefined}
            isUploading={isUploading}
          />
        </div>
      )}

      {isAiGenerationOpen && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <AiGenerationScreen
            isLoading={isUploading}
            roomId={roomId}
            photoFrameId={selectedItem?.id || ""}
            onBack={() => {
              setIsAiGenerationOpen(false);
              setIsUploadImgOpen(true);
            }}
            onAdopt={async (base64Image) => {
              console.log("Image adopted, base64 length:", base64Image.length);
              const file = await convertBase64ToImage(base64Image);
              await handleUploadImgFileUpload(file);
              setIsAiGenerationOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
