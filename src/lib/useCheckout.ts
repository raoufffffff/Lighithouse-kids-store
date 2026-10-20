'use client'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AbContext, abTrack, cartDone, cartSession, saveCart } from '@/lib/ab'
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/public-env'
import { track } from '@/lib/track'
import type { Offer, Rate, Variant } from '@/lib/types'

export type CheckoutInput = {
  productId: string
  productName: string
  basePrice: number
  variants: Variant[]
  offers?: Offer[]
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

/** All order-form state and behaviour, shared by the classic OrderForm and AI-generated pages. */
export function useCheckout({ productId, productName, basePrice, variants, offers = [], rates }: CheckoutInput) {
  const ab = useContext(AbContext)
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
  // Quantity offers. Hidden when the chosen variant has too little stock (maxQty follows the variant's stock)
  // or its own price; the server prices them again, so this is only what the visitor sees.
  const offersView = (variant?.price != null ? [] : offers)
    .filter((o) => o.qty >= 2 && o.qty <= maxQty)
    .map((o) => ({ ...o, saving: Math.max(0, unitPrice * o.qty - o.total), perUnit: Math.round(o.total / o.qty) }))
  const activeOffer = offersView.find((o) => o.qty === qty) ?? null
  const pickOffer = (q: number) => setQty(Math.max(1, Math.min(maxQty, q)))
  const subtotal = activeOffer ? activeOffer.total : unitPrice * qty
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

  // Abandoned-cart capture: only once name, a valid phone, wilaya and commune are all entered.
  const cleanPhoneNow = phone.replace(/[\s.\-]/g, '')
  const cartReady = name.trim().length >= 2 && /^0[567]\d{8}$/.test(cleanPhoneNow) && wilaya !== '' && commune.trim().length >= 2 && !honey
  const abId = ab?.variantId ?? null
  useEffect(() => {
    if (!cartReady || status !== 'idle') return
    const sid = cartSession()
    if (!sid) return
    const t = setTimeout(() => {
      saveCart({
        p_session: sid,
        p_product: productId,
        p_variant: variant?.id ?? null,
        p_qty: qty,
        p_name: name.trim(),
        p_phone: cleanPhoneNow,
        p_wilaya: Number(wilaya),
        p_commune: commune.trim(),
        p_delivery_type: dtype,
        p_ab: abId,
      })
    }, 1500)
    return () => clearTimeout(t)
  }, [cartReady, status, productId, variant?.id, qty, name, cleanPhoneNow, wilaya, commune, dtype, abId])

  const begin = () => {
    if (started.current) return
    started.current = true
    track('InitiateCheckout', { content_ids: [productId], content_type: 'product', num_items: qty, value: total, currency: 'DZD' })
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
      cartDone(cartSession())
      if (ab && body.order_number > 0) abTrack(ab.variantId, 'order', body.order_number)
      // Purchase fires only here, after the order was really accepted (never on page load).
      // The order number doubles as the event id so a server-side copy would be de-duplicated.
      if (body.order_number > 0) {
        track(
          'Purchase',
          { content_ids: [productId], content_type: 'product', contents: [{ id: productId, quantity: qty }], num_items: qty, value: body.total, currency: 'DZD' },
          `purchase_${body.order_number}`,
        )
      }
      setTimeout(() => doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    } catch {
      setError('لا يوجد اتصال بالإنترنت، حاول مرة أخرى')
      setStatus('idle')
    }
  }

  return {
    colors, sizes, hasVariants, firstAvailable, variant,
    color, size, setSize, pickColor, colorAvailable, sizeAvailable,
    qty, setQty, maxQty,
    name, setName, phone, setPhone,
    wilaya, pickWilaya, commune, setCommune, communes,
    address, setAddress, dtype, setDtype, honey, setHoney,
    rate, deskBlocked, fee, unitPrice, subtotal, total,
    offers: offersView, activeOffer, pickOffer,
    status, error, done, doneRef, submit, begin,
  }
}
