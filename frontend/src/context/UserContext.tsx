import type { User } from "common/generate/adventSphereAPI.schemas";
import { useGetUsersId, usePostUsers } from "common/generate/user/user";
import { createContext, useContext, useState } from "react";
import Loading from "@/components/Loading";
import { generateUserId, getUserId, setUserId } from "@/lib/user-storage";

interface UserContextType {
  user: User | undefined;
  isLoading: boolean;
  createUser: (name: string) => Promise<string>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const userId = getUserId() ?? "";
  const [isLoading, setIsLoading] = useState(true);
  const { mutateAsync: postUsers } = usePostUsers();
  const {
    data: user,
    isLoading: isUserLoading,
    refetch,
  } = useGetUsersId(userId, {
    query: {
      enabled: !!userId,
      retry: false,
    },
  });

  const createUser = async (name: string) => {
    try {
      const newUserId = generateUserId();
      setIsLoading(true);
      await postUsers({
        data: { id: newUserId, name },
      });
      setUserId(newUserId);
      refetch();
      return newUserId;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return <Loading text="読み込み中..." />;
  }

  return (
    <UserContext.Provider value={{ user, isLoading, createUser: createUser }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
