type PaymentIconInput = {
  paymentName: string
  paymentTypeName?: string | null
}

type PaymentKind = 'bank' | 'card' | 'cash' | 'qr' | 'transfer'
type BrandedPaymentKind = Exclude<PaymentKind, 'cash' | 'transfer'>
type BrandedIconRule = {
  aliases: string[]
  fileName: string
}

const iconPath = (fileName: string) => `/payment-icons/${fileName}.svg`

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ja-JP')
    .replace(/[\s\u3000・_-]/g, '')
}

function normalizePaymentName(value: string, kind: BrandedPaymentKind) {
  const normalized = normalize(value)
  return kind === 'bank' ? normalized.replace(/銀行|bank/g, '') : normalized
}

function getPaymentKind(paymentTypeName: string | null | undefined): PaymentKind | null {
  switch (normalize(paymentTypeName ?? '')) {
    case 'bank':
    case 'bankaccount':
    case '銀行':
    case '銀行口座':
    case '口座':
      return 'bank'
    case 'card':
    case 'credit':
    case 'creditcard':
    case 'カード':
    case 'クレカ':
    case 'クレジット':
    case 'クレジットカード':
    case 'カード払い':
      return 'card'
    case 'cash':
    case '現金':
      return 'cash'
    case 'qr':
    case 'qrpay':
    case 'qrcode':
    case 'qrペイ':
    case 'qrコード':
    case 'qr決済':
    case 'qrコード決済':
    case 'qrpayment':
    case 'コード決済':
    case 'codepayment':
    case 'スマホ決済':
      return 'qr'
    case 'banktransfer':
    case '振込':
    case '振り込み':
    case '銀行振込':
      return 'transfer'
    default:
      return null
  }
}

const brandedIcons: Record<BrandedPaymentKind, BrandedIconRule[]> = {
  bank: [
    { aliases: ['イオン', 'AEON'], fileName: 'bank_aeon' },
    { aliases: ['auじぶん', 'じぶん'], fileName: 'bank_jibun' },
    { aliases: ['みずほ', 'Mizuho'], fileName: 'bank_mizuho' },
    { aliases: ['三菱東京UFJ', '三菱UFJ', 'Mitsubishi UFJ', 'MUFG'], fileName: 'bank_mufg' },
    { aliases: ['PayPay', 'ペイペイ'], fileName: 'bank_paypay' },
    { aliases: ['楽天', 'Rakuten'], fileName: 'bank_rakuten' },
    { aliases: ['住信SBIネット', 'SBIネット', 'Sumishin SBI Net', '住信SBI', 'SBI'], fileName: 'bank_sbi' },
    { aliases: ['三井住友', 'Sumitomo Mitsui', 'SMBC', 'Olive', 'オリーブ'], fileName: 'bank_smbc' },
    { aliases: ['ソニー', 'Sony'], fileName: 'bank_sony' },
    { aliases: ['ゆうちょ', 'Japan Post'], fileName: 'bank_yucho' },
  ],
  card: [
    { aliases: ['イオンカード', 'AEON Card', 'イオン'], fileName: 'card_aeon' },
    { aliases: ['アメリカン・エキスプレス', 'American Express', 'アメックス', 'Amex'], fileName: 'card_amex' },
    { aliases: ['au PAY カード', 'au PAY Card', 'au PAY', 'au WALLET クレジットカード', 'auカード', 'auwallet'], fileName: 'card_au_pay' },
    { aliases: ['dカード', 'd Card', 'dcard'], fileName: 'card_d' },
    { aliases: ['エポスカード', 'EPOS Card', 'エポス', 'EPOS'], fileName: 'card_epos' },
    { aliases: ['JCBカード', 'JCB Card', 'JCB'], fileName: 'card_jcb' },
    { aliases: ['PayPayカード', 'PayPay Card', 'PayPay', 'ペイペイ'], fileName: 'card_paypay' },
    { aliases: ['楽天カード', 'Rakuten Card', '楽天'], fileName: 'card_rakuten' },
    { aliases: ['セゾンカード', 'SAISON CARD', 'クレディセゾン', 'セゾン', 'Saison'], fileName: 'card_saison' },
    { aliases: ['三井住友カード', 'Sumitomo Mitsui Card', 'SMBCカード', '三井住友', 'SMBC', 'Oliveフレキシブルペイ', 'Olive', 'オリーブ'], fileName: 'card_smbc' },
  ],
  qr: [
    { aliases: ['イオンペイ', 'AEON Pay', 'AEONPAY'], fileName: 'qr_aeon_pay' },
    { aliases: ['au PAY', 'auペイ', 'aupay', 'エーユーペイ'], fileName: 'qr_au_pay' },
    { aliases: ['d払い', 'd Barai', 'dbarai'], fileName: 'qr_dbarai' },
    { aliases: ['ファミペイ', 'FamiPay', 'Fami Pay'], fileName: 'qr_famipay' },
    { aliases: ['J-Coin Pay', 'J Coin Pay', 'Jコインペイ', 'jcoinpay', 'jcoin'], fileName: 'qr_jcoin' },
    { aliases: ['メルペイ', 'Merpay', 'Mer Pay'], fileName: 'qr_merpay' },
    { aliases: ['PayPay', 'Pay Pay', 'ペイペイ'], fileName: 'qr_paypay' },
    { aliases: ['楽天ペイ', 'Rakuten Pay', '楽天Pay', 'rakutenpay'], fileName: 'qr_rakuten_pay' },
  ],
}

const genericIcons: Record<PaymentKind, string> = {
  bank: 'generic_bank',
  card: 'generic_card',
  cash: 'generic_cash',
  qr: 'generic_qr',
  transfer: 'generic_transfer',
}

function getBrandedIconFileName(kind: BrandedPaymentKind, paymentName: string) {
  const normalizedPaymentName = normalizePaymentName(paymentName, kind)

  return brandedIcons[kind]
    .flatMap((rule) => rule.aliases.map((alias) => ({ alias: normalizePaymentName(alias, kind), fileName: rule.fileName })))
    .sort((left, right) => right.alias.length - left.alias.length)
    .find(({ alias }) => normalizedPaymentName.includes(alias))?.fileName
}

/** Returns a decorative payment icon URL, or null when the payment type is unavailable. */
export function getPaymentIconSource({ paymentName, paymentTypeName }: PaymentIconInput) {
  const kind = getPaymentKind(paymentTypeName)
  if (!kind) return null

  const fileName = kind === 'cash' || kind === 'transfer'
    ? genericIcons[kind]
    : getBrandedIconFileName(kind, paymentName) ?? genericIcons[kind]

  return iconPath(fileName)
}
