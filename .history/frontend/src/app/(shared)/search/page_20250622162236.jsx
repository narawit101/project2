export default function Search() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <SearchResults />
    </Suspense>
  );
}