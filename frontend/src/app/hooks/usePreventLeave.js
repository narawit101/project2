import { useEffect } from "react";

export const usePreventLeave = (startProcessLoad) => {
  useEffect(() => {
    //รีเฟชหน้าหรือออกจากหน้าในขณะที่กำลังโหลดข้อมูล
    const handleBeforeUnload = (e) => {
      if (!startProcessLoad) return;
      e.preventDefault();
      e.returnValue = "";
    };
    // กดปุ่มย้อนกลับในเบราว์เซอร์ขณะกำลังโหลดข้อมูล
    const handlePopState = (e) => {
      if (startProcessLoad) {
        const confirmed = window.confirm(
          "กำลังโหลดอยู่ ออกจากหน้านี้จริงหรือ?"
        );
        if (!confirmed) {
          window.history.pushState(null, "", window.location.pathname);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [startProcessLoad]);
};
