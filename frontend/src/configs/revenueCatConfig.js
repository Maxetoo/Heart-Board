

import { Purchases, PurchasesError, ErrorCode } from '@revenuecat/purchases-js'

const RC_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY

let _currentUserId = null


export function initPurchases(appUserId) {
  if (!appUserId) return null

  // Already configured for this user — return shared instance
  if (_currentUserId === appUserId && Purchases.isConfigured()) {
    return Purchases.getSharedInstance()
  }

  // Different user or not yet configured — (re)configure
  _currentUserId = appUserId
  return Purchases.configure({
    apiKey:    RC_API_KEY,
    appUserId: String(appUserId),
  })
}


export function getSharedInstance() {
  if (!Purchases.isConfigured()) {
    throw new Error('RevenueCat not initialised. Call initPurchases(userId) first.')
  }
  return Purchases.getSharedInstance()
}

export async function purchaseProPlan(appUserId) {
  const purchases = initPurchases(appUserId)

  const offerings = await purchases.getOfferings()
  const current   = offerings.current

  if (!current || !current.availablePackages?.length) {
    throw new Error('No offerings available. Make sure your RC dashboard has an active offering.')
  }

  // Prefer the monthly package; fall back to the first available package
  const pkg =
    current.monthly ??
    current.availablePackages.find(p =>
      p.identifier === '$rc_monthly' ||
      p.product?.identifier?.toLowerCase().includes('pro')
    ) ??
    current.availablePackages[0]

  if (!pkg) throw new Error('Pro package not found in current offering.')

  try {
    const result = await purchases.purchase({ rcPackage: pkg })
    return result.customerInfo
  } catch (err) {
    // User deliberately cancelled — return null so the caller can handle silently
    if (
      err instanceof PurchasesError &&
      err.errorCode === ErrorCode.UserCancelledError
    ) {
      return null
    }
    throw err
  }
}


export async function purchasePackageById(appUserId, packageIdentifier) {
  const purchases = initPurchases(appUserId)
  const offerings = await purchases.getOfferings()

  let pkg = null
  for (const offering of Object.values(offerings.all)) {
    pkg = offering.availablePackages.find(p => p.identifier === packageIdentifier)
    if (pkg) break
  }

  if (!pkg) throw new Error(`Package "${packageIdentifier}" not found in any offering.`)

  try {
    const result = await purchases.purchase({ rcPackage: pkg })
    return result.customerInfo
  } catch (err) {
    if (
      err instanceof PurchasesError &&
      err.errorCode === ErrorCode.UserCancelledError
    ) {
      return null
    }
    throw err
  }
}


export async function getCustomerInfo(appUserId) {
  const purchases = initPurchases(appUserId)
  return purchases.getCustomerInfo()
}

export const RC_ENTITLEMENTS = {
  PRO:            'pro',
  BOARD_STANDARD: 'board_upgrade_standard',
  BOARD_PREMIUM:  'board_upgrade_premium',
}

export const RC_PRODUCTS = {
  PRO_MONTHLY:       '$rc_monthly',
  PRO_ANNUAL:        '$rc_annual',
  BOARD_STANDARD:    'board_upgrade_standard',
  BOARD_PREMIUM:     'board_upgrade_premium',
  SPONSOR_200:       'sponsor_200',
  SPONSOR_1000:      'sponsor_1000',
  SPONSOR_UNLIMITED: 'sponsor_unlimited',
}