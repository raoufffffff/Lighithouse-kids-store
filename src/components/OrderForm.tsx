'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/public-env'
import { dzd } from '@/lib/format'
import { track } from '@/lib/track'
import type { Rate, Variant } from '@/lib/types'

type Props = {
  productId: string
  productName: string
  basePrice: number
  variants: Variant[]
  rates: Rate[]
}

const ERRORS: Record<string, string> = {
  invalid_name: 'أدخل اسمك الكامل',
  invalid_phone: 'أدخل رقم هاتف جزائري صحيح، مثال: 0555123456',
  invalid_commune: 'أدخل اسم البلدية',
  invalid_wilaya: 'اختر الولاية',
  out_of_stock: 'نعتذر، الكمية المطلوبة غير متوفرة حالياً',
  variant_unavailable: 'هذا الخيار لم يعد متوفراً، اختر خياراً آخر',
  variant_required: 'اختر اللون والمقاس',
  product_unavailable: 'هذا المنتج لم يعد متوفراً',
}

type Commune = { name: string; desk: boolean }

const uniq = (a: (string | null)[]) => Array.from(new Set(a.filter((x): x is string => !!x)))
const inStock = (v: Variant) => v.stock_quantity > 0

const inputCls =
  'w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export default function OrderForm({ productId, productName, basePrice, variants, rates }: Props) {
  const firstAvailable = variants.find(inStock)
  const [color, setColor] = useState<string>(firstAvailable?.color ?? '')
  const [size, setSize] = useState<string>(firstAvailable?.size ?? '')
  const [qty, setQty] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [commune, setCommune] = useState('')
  const [communes, setCommunes] = useState<Commune[] | 'loading' | 'error'>([])
  const communeCache = useRef(new Map<string, Commune[]>())
  const [address, setAddress] = useState('')
  const [dtype, setDtype] = useState<'home' | 'desk'>('home')
  const [honey, setHoney] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ number: number; total: number } | null>(null)
  const started = useRef(false)
  const doneRef = useRef<HTMLDivElement>(null)

  const colors = useMemo(() => uniq(variants.map((v) => v.color)), [variants])
  const sizes = useMemo(() => uniq(variants.map((v) => v.size)), [variants])
  const hasVariants = variants.length > 0
  const variant = hasVariants
    ? variants.find((v) => (v.color ?? '') === color && (v.size ?? '') === size)
    : undefined

  const unitPrice = variant?.price ?? basePrice
  const maxQty = Math.max(1, Math.min(10, variant ? variant.stock_quantity : 10))
  const rate = rates.find((r) => String(r.code) === wilaya)
  const selectedCommune = Array.isArray(communes) ? communes.find((c) => c.name === commune) : undefined
  // Stop-desk delivery is only offered where the commune has a desk.
  const deskBlocked = selectedCommune ? !selectedCommune.desk : false
  const fee = rate ? (dtype === 'home' ? rate.home : rate.desk) : null
  const subtotal = unitPrice * qty
  const total = subtotal + (fee ?? 0)

  useEffect(() => {
    track('ViewContent', { content_name: productName, content_ids: [productId], content_type: 'product', value: basePrice, currency: 'DZD' })
  }, [productId, productName, basePrice])

  useEffect(() => {
    if (qty > maxQty) setQty(maxQty)
  }, [maxQty, qty])

  useEffect(() => {
    if (deskBlocked && dtype === 'desk') setDtype('home')
  }, [deskBlocked, dtype])

  const pickWilaya = async (code: string) => {
    setWilaya(code)
    setCommune('')
    if (!code) return setCommunes([])
    const cached = communeCache.current.get(code)
    if (cached) return setCommunes(cached)
    setCommunes('loading')
    try {
      const res = await fetch(`/communes/${code}.json`)
      if (!res.ok) throw new Error('bad status')
      const rows = (await res.json()) as [string, number][]
      const list = rows.map(([name, desk]) => ({ name, desk: desk === 1 }))
      communeCache.current.set(code, list)
      setCommunes((cur) => (cur === 'loading' ? list : cur))
    } catch {
      setCommunes('error')
    }
  }

  const colorAvailable = (c: string) => variants.some((v) => v.color === c && inStock(v))
  const sizeAvailable = (s: string) => variants.some((v) => v.size === s && inStock(v) && (!color || v.color === color))

  const pickColor = (c: string) => {
    setColor(c)
    const match =
      variants.find((v) => v.color === c && v.size === size && inStock(v)) ?? variants.find((v) => v.color === c && inStock(v))
    if (match) setSize(match.size ?? '')
  }

  const begin = () => {
    if (started.current) return
    started.current = true
    track('InitiateCheckout', { content_ids: [productId], value: total, currency: 'DZD' })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (status !== 'idle') return
    setError('')

    if (honey) {
      // Bots fill hidden fields; pretend success and drop the request.
      setDone({ number: 0, total })
      return setStatus('done')
    }
    const cleanPhone = phone.replace(/[\s.\-]/g, '')
    if (name.trim().length < 2) return setError(ERRORS.invalid_name)
    if (!/^0[567]\d{8}$/.test(cleanPhone)) return setError(ERRORS.invalid_phone)
    if (!wilaya) return setError(ERRORS.invalid_wilaya)
    if (commune.trim().length < 2) return setError(ERRORS.invalid_commune)
    if (dtype === 'desk' && deskBlocked) return setError('لا يوجد مكتب توصيل في هذه البلدية')
    if (hasVariants && (!variant || !inStock(variant))) return setError(ERRORS.variant_required)

    setStatus('sending')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lh_place_order`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_name: name.trim(),
          p_phone: cleanPhone,
          p_wilaya: Number(wilaya),
          p_commune: commune.trim(),
          p_address: address.trim() || null,
          p_delivery_type: dtype,
          p_items: [{ product_id: productId, variant_id: variant?.id ?? null, qty }],
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(ERRORS[String(body?.message)] ?? 'تعذّر إرسال الطلب، حاول مرة أخرى')
        return setStatus('idle')
      }
      setDone({ number: body.order_number, total: body.total })
      setStatus('done')
      track('Purchase', { content_ids: [productId], value: body.total, currency: 'DZD' })
      setTimeout(() => doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    } catch {
      setError('لا يوجد اتصال بالإنترنت، حاول مرة أخرى')
      setStatus('idle')
    }
  }

  if (status === 'done' && done) {
    return (
      <div id="order" ref={doneRef} className="scroll-mt-20 rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-emerald-200">
        <div className="text-5xl" aria-hidden>🎉</div>
        <h2 className="mt-2 text-2xl font-extrabold text-ink">تم استلام طلبك!</h2>
        {done.number > 0 && <p className="mt-1 text-slate-500">رقم الطلب: <b dir="ltr">#{done.number}</b></p>}
        <p className="mt-3 text-slate-600">سنتصل بك قريباً على الرقم الذي أدخلته لتأكيد الطلب. الدفع عند الاستلام.</p>
        <p className="mt-3 text-lg font-extrabold text-brand-600">الإجمالي: {dzd(done.total)}</p>
      </div>
    )
  }

  const chip = (active: boolean, disabled: boolean) =>
    `min-w-12 rounded-xl border-2 px-4 py-2 text-sm font-bold transition ${
      active
        ? 'border-brand-600 bg-brand-600 text-white'
        : disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 line-through'
          : 'border-brand-200 bg-white text-ink hover:border-brand-500'
    }`

  return (
    <form
      id="order"
      onSubmit={submit}
      onFocus={begin}
      noValidate
      className="scroll-mt-20 rounded-3xl bg-white p-5 shadow-lg ring-1 ring-brand-100 sm:p-6"
    >
      <h2 className="text-xl font-extrabold text-ink">اطلب الآن 🛒</h2>
      <p className="mt-0.5 text-sm text-slate-500">املأ معلوماتك وسنتصل بك لتأكيد الطلب. الدفع عند الاستلام.</p>

      <div className="mt-4 space-y-4">
        {colors.length > 0 && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-ink">اللون</legend>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c} type="button" disabled={!colorAvailable(c)} onClick={() => pickColor(c)} className={chip(c === color, !colorAvailable(c))} aria-pressed={c === color}>
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {sizes.length > 0 && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-ink">المقاس</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button key={s} type="button" disabled={!sizeAvailable(s)} onClick={() => setSize(s)} className={chip(s === size, !sizeAvailable(s))} aria-pressed={s === size}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {hasVariants && !firstAvailable && (
          <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">نفدت الكمية حالياً.</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">الكمية</span>
          <div className="flex items-center gap-1 rounded-xl border-2 border-brand-200">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-10 text-xl font-bold text-brand-600" aria-label="إنقاص">−</button>
            <span className="w-8 text-center text-base font-extrabold" aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="h-10 w-10 text-xl font-bold text-brand-600" aria-label="زيادة">+</button>
          </div>
        </div>

        <div className="space-y-3 border-t border-brand-100 pt-4">
          <input className={inputCls} placeholder="الاسم الكامل" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputCls} placeholder="رقم الهاتف (0555 12 34 56)" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" style={{ textAlign: 'right' }} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <select className={inputCls} value={wilaya} onChange={(e) => pickWilaya(e.target.value)} aria-label="الولاية">
            <option value="">اختر الولاية</option>
            {rates.map((r) => (
              <option key={r.code} value={r.code}>{`\u202A${String(r.code).padStart(2, '0')} - ${r.name}\u202C`}</option>
            ))}
          </select>
          {communes === 'error' ? (
            <input className={inputCls} placeholder="البلدية" autoComplete="address-level2" value={commune} onChange={(e) => setCommune(e.target.value)} />
          ) : (
            <select
              className={inputCls}
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              disabled={!wilaya || communes === 'loading'}
              aria-label="البلدية"
            >
              <option value="">
                {!wilaya ? 'اختر الولاية أولاً' : communes === 'loading' ? 'جارٍ تحميل البلديات…' : 'اختر البلدية'}
              </option>
              {Array.isArray(communes) &&
                communes.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
            </select>
          )}

          {rate && (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="طريقة التوصيل">
              {([['home', 'للمنزل', rate.home], ['desk', 'للمكتب', rate.desk]] as const).map(([val, label, price]) => (
                <button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={dtype === val}
                  disabled={val === 'desk' && deskBlocked}
                  onClick={() => setDtype(val)}
                  className={`rounded-xl border-2 p-3 text-center transition ${
                    val === 'desk' && deskBlocked
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                      : dtype === val
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-brand-200 bg-white'
                  }`}
                >
                  <span className="block text-sm font-bold text-ink">{label}</span>
                  <span className="block text-base font-extrabold text-brand-600">
                    {val === 'desk' && deskBlocked ? 'غير متوفر' : price === 0 ? 'مجاني' : dzd(price)}
                  </span>
                </button>
              ))}
            </div>
          )}
          {rate && deskBlocked && (
            <p className="-mt-1 text-xs font-semibold text-slate-500">لا يوجد مكتب توصيل في هذه البلدية، التوصيل للمنزل فقط.</p>
          )}
          {rate && dtype === 'home' && (
            <input className={inputCls} placeholder="العنوان (اختياري)" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          )}

          {/* Honeypot: invisible to people, tempting to bots */}
          <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" value={honey} onChange={(e) => setHoney(e.target.value)} />
        </div>

        <dl className="space-y-1.5 rounded-2xl bg-brand-50 p-4 text-sm">
          <div className="flex justify-between"><dt className="text-slate-600">المنتج × {qty}</dt><dd className="font-bold">{dzd(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-slate-600">التوصيل</dt>
            <dd className="font-bold">{fee === null ? 'اختر الولاية' : fee === 0 ? 'مجاني' : dzd(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-brand-200 pt-2 text-lg">
            <dt className="font-extrabold text-ink">الإجمالي</dt><dd className="font-extrabold text-brand-600">{dzd(total)}</dd>
          </div>
        </dl>

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={status === 'sending' || (hasVariants && !firstAvailable)}
          className="w-full rounded-2xl bg-orange-400 py-4 text-lg font-extrabold text-ink shadow-lg shadow-orange-400/30 transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'sending' ? 'جارٍ إرسال الطلب…' : `تأكيد الطلب · ${dzd(total)}`}
        </button>
      </div>
    </form>
  )
}
