import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-6xl" aria-hidden>🧩</p>
      <h1 className="mt-4 text-2xl font-extrabold text-ink">الصفحة غير موجودة</h1>
      <p className="mt-2 text-slate-500">ربما انتهى عرض هذه اللعبة أو تغيّر رابطها.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-orange-400 px-6 py-2.5 font-extrabold text-ink">
        العودة للمتجر
      </Link>
    </main>
  )
}
