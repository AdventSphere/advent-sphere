import { useInfiniteQuery } from "@tanstack/react-query";
import type { Item } from "common/generate/adventSphereAPI.schemas";
import { getItems } from "common/generate/item/item";

export const useGetInfiniteItems = (type: string) => {
  return useInfiniteQuery({
    queryKey: ["items", type],
    queryFn: ({ pageParam }) =>
      getItems({
        offset: pageParam,
        limit: 60,
        type: type === "all" ? undefined : type,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Item[], allPages) => {
      if (lastPage.length === 0 || lastPage.length < 30) {
        return undefined; // これ以上ページがない
      }
      return allPages.flat().length; // 累積アイテム数 = 次のoffset
    },
  });
};
