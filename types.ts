
export enum VoucherType {
  NOMINAL = 'NOMINAL',
  PERCENT = 'PERCENT'
}

export enum MarginType {
  NOMINAL = 'NOMINAL',
  PERCENT = 'PERCENT'
}

export interface ProductData {
  id: string;
  name: string;
  quantity: number; 
  costPrice: number; 
  sellingPrice: number; 
  
  // Voucher
  voucherType: VoucherType;
  voucherAmount: number | string;

  // Shopee Fees
  adminFeePercent: number | string;
  freeShippingXtraPercent: number | string;
  promoXtraPercent: number | string;
  orderProcessingFee: number;

  // Growlab Fees
  growlabFeePercent: number | string;
  growlabServicePercent: number | string;

  // Pricing Calculator specific (Optional fields used when in Pricing Mode)
  targetMarginType?: MarginType;
  targetMarginValue?: number | string;
}

export interface CalculationResult {
  priceAfterVoucher: number;
  deductionVoucher: number;
  
  feeAdmin: number;
  feeFreeShipping: number;
  feePromo: number;
  feeProcessing: number;
  
  totalShopeeFees: number;
  netIncome: number; 

  feeGrowlab: number; 
  feeGrowlabService: number; 
  netIncomeAfterGrowlab: number; 

  profit: number; 
  profitMargin: number; 
  
  netProfitMargin: number; 
  minROAS: number; 
}
