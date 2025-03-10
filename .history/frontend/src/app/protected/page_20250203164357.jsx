import ProtectedPage from "../components/ProtectedPage";

export default function Dashboard() {
  return (
    <ProtectedPage>
      <h1>แดชบอร์ด</h1>
      <p>ยินดีต้อนรับ</p>
    </ProtectedPage>
  );
}
