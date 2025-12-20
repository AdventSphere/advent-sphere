import { createContext, useContext, useState } from "react";
import {
  useGetRoomsIdIsPasswordProtected,
  usePostRoomsIdVerifyPassword,
} from "common/generate/room/room";

interface PasswordContextType {
  roomId: string | null;
  isPasswordProtected: boolean | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setRoomId: (roomId: string) => void;
  sendPassword: (password: string) => Promise<void>;
  clearAuth: () => void;
}

const PasswordContext = createContext<PasswordContextType | undefined>(
  undefined,
);

export const PasswordProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [roomId, setRoomIdState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // パスワード保護状態をチェック
  const { data: passwordProtectionData, isLoading: isCheckingProtection } =
    useGetRoomsIdIsPasswordProtected(roomId || "", {
      query: {
        enabled: !!roomId && roomId.length > 0,
        retry: false,
      },
    });

  // パスワード認証
  const { mutateAsync: verifyPassword, isPending: isVerifyingPassword } =
    usePostRoomsIdVerifyPassword();

  const setRoomId = (newRoomId: string) => {
    if (roomId !== newRoomId) {
      setRoomIdState(newRoomId);
      setIsAuthenticated(false);
    }
  };

  const sendPassword = async (password: string) => {
    if (!roomId) {
      throw new Error("ルームIDが設定されていません");
    }

    try {
      await verifyPassword({
        id: roomId,
        data: { password },
      });
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const clearAuth = () => {
    setIsAuthenticated(false);
    setRoomIdState(null);
  };

  const isPasswordProtected =
    passwordProtectionData?.isPasswordProtected ?? null;
  const isLoading = isCheckingProtection || isVerifyingPassword;

  return (
    <PasswordContext.Provider
      value={{
        roomId,
        isPasswordProtected,
        isAuthenticated,
        isLoading,
        setRoomId,
        sendPassword,
        clearAuth,
      }}
    >
      {children}
    </PasswordContext.Provider>
  );
};

export function usePassword(): PasswordContextType {
  const context = useContext(PasswordContext);
  if (!context) {
    throw new Error("usePassword must be used within a PasswordProvider");
  }
  return context;
}
