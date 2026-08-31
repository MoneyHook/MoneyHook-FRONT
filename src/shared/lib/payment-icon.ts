type PaymentIconInput = {
  paymentName: string
  paymentTypeName?: string | null
}

type PaymentKind = 'bank' | 'card' | 'cash' | 'qr' | 'transfer'

const iconPath = (fileName: string) => `/payment-icons/${fileName}.svg`

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ja-JP')
    .replace(/[\s\u3000・_-]/g, '')
}

function getPaymentKind(paymentTypeName: string | null | undefined): PaymentKind | null {
  switch (normalize(paymentTypeName ?? '')) {
    case '銀行':
    case '銀行口座':
      return 'bank'
    case 'カード':
    case 'クレジットカード':
      return 'card'
    case '現金':
      return 'cash'
    case 'qrペイ':
    case 'qr決済':
    case 'qrコード決済':
      return 'qr'
    case '振込':
    case '銀行振込':
      return 'transfer'
    default:
      return null
  }
}

const brandedIcons: Record<Exclude<PaymentKind, 'cash' | 'transfer'>, Record<string, string>> = {
  bank: {
    イオン銀行: 'bank_aeon',
    aeonbank: 'bank_aeon',
    'auじぶん銀行': 'bank_jibun',
    じぶん銀行: 'bank_jibun',
    みずほ銀行: 'bank_mizuho',
    三菱ufj銀行: 'bank_mufg',
    三菱東京ufj銀行: 'bank_mufg',
    paypay銀行: 'bank_paypay',
    楽天銀行: 'bank_rakuten',
    住信sbiネット銀行: 'bank_sbi',
    三井住友銀行: 'bank_smbc',
    sonybank: 'bank_sony',
    ソニー銀行: 'bank_sony',
    ゆうちょ銀行: 'bank_yucho',
    ゆうちょ: 'bank_yucho',
  },
  card: {
    イオンカード: 'card_aeon',
    aeoncard: 'card_aeon',
    アメックス: 'card_amex',
    アメリカンエキスプレス: 'card_amex',
    americanexpress: 'card_amex',
    amex: 'card_amex',
    'aupayカード': 'card_au_pay',
    dカード: 'card_d',
    dcard: 'card_d',
    エポスカード: 'card_epos',
    eposcard: 'card_epos',
    jcbカード: 'card_jcb',
    jcb: 'card_jcb',
    paypayカード: 'card_paypay',
    paypay: 'card_paypay',
    楽天カード: 'card_rakuten',
    セゾンカード: 'card_saison',
    クレディセゾン: 'card_saison',
    三井住友カード: 'card_smbc',
    smbcカード: 'card_smbc',
  },
  qr: {
    aeonpay: 'qr_aeon_pay',
    イオンペイ: 'qr_aeon_pay',
    aupay: 'qr_au_pay',
    d払い: 'qr_dbarai',
    dbarai: 'qr_dbarai',
    famipay: 'qr_famipay',
    'jcoinpay': 'qr_jcoin',
    jcoin: 'qr_jcoin',
    メルペイ: 'qr_merpay',
    merpay: 'qr_merpay',
    paypay: 'qr_paypay',
    楽天ペイ: 'qr_rakuten_pay',
    rakutenpay: 'qr_rakuten_pay',
  },
}

const genericIcons: Record<PaymentKind, string> = {
  bank: 'generic_bank',
  card: 'generic_card',
  cash: 'generic_cash',
  qr: 'generic_qr',
  transfer: 'generic_transfer',
}

/** Returns a decorative payment icon URL, or null when the payment type is unavailable. */
export function getPaymentIconSource({ paymentName, paymentTypeName }: PaymentIconInput) {
  const kind = getPaymentKind(paymentTypeName)
  if (!kind) return null

  const fileName = kind === 'cash' || kind === 'transfer'
    ? genericIcons[kind]
    : brandedIcons[kind][normalize(paymentName)] ?? genericIcons[kind]

  return iconPath(fileName)
}
