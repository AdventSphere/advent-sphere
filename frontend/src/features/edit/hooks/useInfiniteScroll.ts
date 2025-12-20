import { useEffect } from "react";

export const useInfiniteScroll = (
  loadMoreRef: React.RefObject<HTMLElement | null>,
  onIntersect: () => void,
  options?: IntersectionObserverInit,
) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect();
        }
      },
      {
        rootMargin: "100px",
        ...options,
      },
    );

    const ref = loadMoreRef.current;
    if (ref) observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [loadMoreRef, onIntersect, options]);
};
