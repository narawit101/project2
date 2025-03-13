export default function HomePage() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      {/* แบนเนอร์หลัก */}
      <div className="relative w-full h-[400px] bg-cover bg-center flex items-center justify-center text-white text-4xl font-bold"
        style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?stadium,sports')" }}>
        <div className="bg-black bg-opacity-50 p-6 rounded-xl">
          <h1 className="text-5xl font-extrabold">จองสนามกีฬาออนไลน์</h1>
          <p className="text-xl mt-2">ง่าย รวดเร็ว พร้อมใช้งาน</p>
          <button className="mt-4 px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-600 transition">
            เริ่มจองสนาม
          </button>
        </div>
      </div>

      {/* ส่วนแสดงสนามยอดนิยม */}
      <div className="max-w-6xl w-full px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-6">สนามยอดนิยม</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6,7].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={`https://source.unsplash.com/400x300/?sports,stadium${i}`}
                alt="สนามกีฬา"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">สนามกีฬา #{i}</h3>
                <p className="text-gray-600 text-sm">สถานที่ยอดนิยมสำหรับกีฬา</p>
                <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">
                  จองเลย
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ส่วน Footer */}
      <footer className="w-full bg-gray-900 text-white text-center py-6 mt-12">
        <p>&copy; 2025 ระบบจองสนามกีฬาออนไลน์ | All Rights Reserved</p>
      </footer>
    </div>
  );
}
