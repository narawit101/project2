 useEffect(() => {
    console.log("API_URL:", API_URL);
    console.log(" connecting socket...");

    socketRef.current = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log(" Socket connected:", socket.id);
    });

    socket.on("slot_booked", (data) => {
      console.log("booking_id:", data.bookingId);
      setBookingId(data.bookingId);
    });

    socket.on("connect_error", (err) => {
      console.error(" Socket connect_error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  // ดึง slot ที่มีสถานะ
  useEffect(() => {
    if (!bookingDate || !subFieldId) return;
    const fetchBookedSlots = async () => {
      try {
        const bookingDateRaw = sessionStorage.getItem("booking_date");
        const bookingDateFormatted = new Date(bookingDate).toLocaleDateString(
          "en-CA"
        );
        const day = new Date(`${bookingDateFormatted}T00:00:00`);
        const today = new Date(day);
        today.setDate(day.getDate() + 1);
        const tomorrow = new Date(day);
        tomorrow.setDate(day.getDate() + 2);

        const start = today.toISOString().split("T")[0];
        const end = tomorrow.toISOString().split("T")[0];

        console.log(`today: ${bookingDateRaw}`);
        console.log(`start: ${start}`);
        console.log(`end: ${end}`);

        const res = await fetch(
          `${API_URL}/booking/booked-block/${subFieldId}/${start}/${end}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (!data.error) {
          setBookedSlots(data.data);
          // setDataLoading(false);

          const timeRangesWithStatus = data.data.flatMap((item) =>
            (item.selected_slots || []).map((time) => ({
              time,
              status: item.status,
            }))
          );

          const selectedSlotsFromAPI = timeRangesWithStatus.map(
            (item) => item.time
          );

          setBookTimeArr(timeRangesWithStatus);
          setSelectedSlotsArr(selectedSlotsFromAPI);

          // console.log("bookingtime", timeRangesWithStatus);
          //console.log(data.data);
        } else {
          console.error("API returned error:", data.message);
          setMessage("ไม่สามารถดึงข้อมูลได้", data.message);
          setMessageType("error");
        }
      } catch (error) {
        console.error("Failed to fetch booked slots:", error.message);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error.message);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };
    fetchBookedSlots();

    if (isBooked) {
      fetchBookedSlots();
      setIsBooked(false);
    }
  }, [bookingDate, subFieldId, isBooked, bookingId]);