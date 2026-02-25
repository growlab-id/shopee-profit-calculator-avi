
import { ProductData, CalculationResult, VoucherType, MarginType } from './types';

export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `Rp ${formatted}`;
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-US').format(amount);
};

export const parseNumberInput = (val: string): number => {
  const clean = val.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

const getNumber = (val: number | string | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const normalized = val.toString().replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

export const calculateProductMetrics = (product: ProductData): CalculationResult => {
  const qty = product.quantity > 0 ? product.quantity : 1;
  
  const adminFeePercent = getNumber(product.adminFeePercent);
  const freeShippingXtraPercent = getNumber(product.freeShippingXtraPercent);
  const promoXtraPercent = getNumber(product.promoXtraPercent);
  const growlabFeePercent = getNumber(product.growlabFeePercent);
  const growlabServicePercent = getNumber(product.growlabServicePercent);
  const voucherAmount = getNumber(product.voucherAmount);

  let unitDeductionVoucher = 0;
  if (product.voucherType === VoucherType.NOMINAL) {
    unitDeductionVoucher = voucherAmount;
  } else {
    unitDeductionVoucher = product.sellingPrice * (voucherAmount / 100);
  }

  if (unitDeductionVoucher > product.sellingPrice) {
    unitDeductionVoucher = product.sellingPrice;
  }

  const unitPriceAfterVoucher = product.sellingPrice - unitDeductionVoucher;
  const unitFeeAdmin = unitPriceAfterVoucher * (adminFeePercent / 100);

  let unitFeeFreeShipping = unitPriceAfterVoucher * (freeShippingXtraPercent / 100);
  if (unitFeeFreeShipping > 40000) unitFeeFreeShipping = 40000;

  let unitFeePromo = unitPriceAfterVoucher * (promoXtraPercent / 100);
  if (unitFeePromo > 60000) unitFeePromo = 60000;

  const unitFeeProcessing = product.orderProcessingFee;
  const unitTotalShopeeFees = unitFeeAdmin + unitFeeFreeShipping + unitFeePromo + unitFeeProcessing;
  
  const unitNetIncome = unitPriceAfterVoucher - unitTotalShopeeFees;
  
  const unitFeeGrowlab = product.sellingPrice * (growlabFeePercent / 100);
  const unitFeeGrowlabService = unitNetIncome * (growlabServicePercent / 100);
  
  const unitNetIncomeAfterGrowlab = unitNetIncome - unitFeeGrowlab - unitFeeGrowlabService;
  const unitProfit = unitNetIncomeAfterGrowlab - product.costPrice;
  
  const profitMargin = product.costPrice > 0 ? (unitProfit / product.costPrice) * 100 : 0;
  const netProfitMarginDecimal = product.sellingPrice > 0 ? (unitProfit / product.sellingPrice) : 0;
  const netProfitMargin = netProfitMarginDecimal * 100;
  const minROAS = netProfitMarginDecimal > 0.0001 ? (1 / netProfitMarginDecimal) : 0;

  return {
    priceAfterVoucher: unitPriceAfterVoucher * qty,
    deductionVoucher: unitDeductionVoucher * qty,
    feeAdmin: unitFeeAdmin * qty,
    feeFreeShipping: unitFeeFreeShipping * qty,
    feePromo: unitFeePromo * qty,
    feeProcessing: unitFeeProcessing * qty,
    totalShopeeFees: unitTotalShopeeFees * qty,
    netIncome: unitNetIncome * qty,
    feeGrowlab: unitFeeGrowlab * qty,
    feeGrowlabService: unitFeeGrowlabService * qty,
    netIncomeAfterGrowlab: unitNetIncomeAfterGrowlab * qty,
    profit: unitProfit * qty,
    profitMargin: profitMargin,
    netProfitMargin: netProfitMargin,
    minROAS: minROAS
  };
};

/**
 * Calculates the required Selling Price to achieve a target profit.
 * Logic uses Net Margin (Profit / Selling Price) for Percentage targets.
 */
export const calculateRequiredSellingPrice = (product: ProductData): number => {
  const cost = product.costPrice;
  const targetVal = getNumber(product.targetMarginValue);
  
  const admin = getNumber(product.adminFeePercent) / 100;
  const shipping = getNumber(product.freeShippingXtraPercent) / 100;
  const promo = getNumber(product.promoXtraPercent) / 100;
  const proc = product.orderProcessingFee;
  const ops = getNumber(product.growlabFeePercent) / 100;
  const growSvc = getNumber(product.growlabServicePercent) / 100;
  const vchAmt = getNumber(product.voucherAmount);
  const isVchPct = product.voucherType === VoucherType.PERCENT;

  // R = Total Shopee Variable Fee Rate
  const R = admin + shipping + promo;
  const v = isVchPct ? (vchAmt / 100) : 0;
  const V_nom = !isVchPct ? vchAmt : 0;

  // Common constants in the formula:
  // Base Net Income (N) = [ (S(1-v) - V_nom)(1-R) - proc ]
  // Profit (P) = [ N(1 - growSvc) ] - S*ops - cost
  
  if (product.targetMarginType === MarginType.PERCENT) {
    // If PERCENT: P = S * (targetVal / 100)
    // S * m = S(1-v)(1-R)(1-growSvc) - V_nom(1-R)(1-growSvc) - proc(1-growSvc) - S*ops - cost
    // S * [ (1-v)(1-R)(1-growSvc) - ops - (targetVal/100) ] = cost + (V_nom(1-R) + proc)(1-growSvc)
    
    const m = targetVal / 100;
    const numerator = cost + (V_nom * (1 - R) + proc) * (1 - growSvc);
    const denominator = (1 - v) * (1 - R) * (1 - growSvc) - ops - m;

    if (denominator <= 0) return 0;
    return Math.ceil(numerator / denominator);
  } else {
    // If NOMINAL: P = targetVal
    // S * [ (1-v)(1-R)(1-growSvc) - ops ] = targetVal + cost + (V_nom(1-R) + proc)(1-growSvc)
    
    const P = targetVal;
    const numerator = P + cost + (V_nom * (1 - R) + proc) * (1 - growSvc);
    const denominator = (1 - v) * (1 - R) * (1 - growSvc) - ops;

    if (denominator <= 0) return 0;
    return Math.ceil(numerator / denominator);
  }
};
