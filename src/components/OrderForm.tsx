'use client'

import { useCheckout } from '@/lib/useCheckout'
import { dzd } from '@/lib/format'
import type { Offer, Rate, Variant } from '@/lib/types'

type Props = {
  productId: string
  productName: string
  basePrice: number
  variants: Variant[]
  offers?: Offer[]
  rates: Rate[]
}

const inputCls =
  'w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export default function OrderForm(props: Props) {
  const {
    colors, sizes, hasVariants, firstAvailable,
    color, size, setSize, pickColor, colorAvailable, sizeAvailable,
    qty, setQty, maxQty,
    name, setName, phone, setPhone,
    wilaya, pickWilaya, commune, setCommune, communes,
    address, setAddress, dtype, setDtype, honey, setHoney,
    rate, deskBlocked, fee, subtotal, total,
    offers, activeOffer, pickOffer, unitPrice,
    status, error, done, doneRef, submit, begin,
  } = useCheckout(props)

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

        {offers.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-bold text-ink">عروض الكمية</legend>
            {[{ qty: 1, total: unitPrice, label: null as string | null, saving: 0, perUnit: unitPrice }, ...offers].map((o) => (
              <button
                key={o.qty}
                type="button"
                onClick={() => pickOffer(o.qty)}
                aria-pressed={qty === o.qty}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-start transition ${
                  qty === o.qty ? 'border-brand-500 bg-brand-50' : 'border-brand-100 bg-white'
                }`}
              >
                <span className="text-sm font-extrabold text-ink">
                  {o.qty === 1 ? 'قطعة واحدة' : o.label || `${o.qty} قطع`}
                  {o.saving > 0 && <span className="mr-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">وفّر {dzd(o.saving)}</span>}
                </span>
                <span className="text-base font-extrabold text-brand-600">{dzd(o.total)}</span>
              </button>
            ))}
          </fieldset>
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
            {props.rates.map((r) => (
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
