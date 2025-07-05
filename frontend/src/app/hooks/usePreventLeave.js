import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const usePreventLeave = (startProcessLoad) => {
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!startProcessLoad) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = (e) => {
      if (startProcessLoad) {
        const confirmed = window.confirm(
          "กำลังโหลดอยู่ ออกจากหน้านี้จริงหรือ?"
        );
        if (!confirmed) {
          window.history.pushState(null, "", window.location.pathname); // push กลับหน้าเดิม
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState); // กด back

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [startProcessLoad]);
};
