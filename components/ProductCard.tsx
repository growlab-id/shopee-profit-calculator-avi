import React, { useMemo, useState } from 'react';
import { Trash2, TrendingUp, Wallet, ShoppingBag, Percent, Tag, Copy, Box, Target, MoreHorizontal, ArrowUpRight, DollarSign, AlertCircle, ChevronDown } from 'lucide-react';
import { ProductData, VoucherType } from '../types';
import { formatCurrency, calculateProductMetrics, formatNumber, parseNumberInput } from '../utils';

interface ProductCardProps {
  product: ProductData;
  index: number;
  onUpdate: (id: string, field: keyof ProductData, value: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (product: ProductData) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index, onUpdate, onDelete, onDuplicate }) => {
  const result = useMemo(() => calculateProductMetrics(product), [product]);
  
  // Unified error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, message: string | null) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      if (message) newErrors[field] = message;
      else delete newErrors[field];
      return newErrors;
    });
  };

  const handlePriceChange = (field: keyof ProductData, value: string) => {
    const numValue = parseNumberInput(value);
    onUpdate(product.id, field, numValue);
  };

  const handlePercentChange = (field: keyof ProductData, value: string) => {
    let clean = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Validate Percentage > 100
    const numValue = parseFloat(clean);
    if (!isNaN(numValue) && numValue > 100) {
      setFieldError(field as string, 'Maks 100%');
    } else {
      setFieldError(field as string, null);
    }

    onUpdate(product.id, field, clean);
  };

  const handleQtyChange = (value: string) => {
    if (value.includes('-')) {
      setFieldError('quantity', 'Tidak boleh negatif');
    } else {
      setFieldError('quantity', null);
    }
    const numValue = parseNumberInput(value);
    onUpdate(product.id, 'quantity', numValue);
  };

  // Helper to get input border classes based on error state
  const getInputClasses = (field: string, isDefaultError: boolean = false) => {
    const hasError = errors[field] || isDefaultError;
    return `transition-all ${
      hasError 
        ? 'border-red-500 ring-1 ring-red-500/20 focus-within:border-red-500 focus-within:ring-red-500/30' 
        : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
    }`;
  };

  // Helper for dynamic profit font size
  const profitString = formatCurrency(result.profit);
  const getProfitFontSize = (str: string) => {
    // Adjusted thresholds for tighter fit
    if (str.length > 13) return 'text-lg'; // Very long numbers (e.g. -Rp 10.000.000)
    if (str.length > 10) return 'text-xl'; // Long numbers
    if (str.length > 8) return 'text-2xl'; // Medium numbers
    return 'text-3xl xl:text-3xl'; // Normal numbers
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-emerald-200 hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* Decorative Top Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>

      {/* Header */}
      <div className="pt-5 px-5 pb-2 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <ShoppingBag size={20} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">Produk #{index + 1}</span>
            <input 
              type="text" 
              value={product.name}
              onChange={(e) => onUpdate(product.id, 'name', e.target.value)}
              placeholder="Nama Produk..."
              className="block w-full text-base font-bold text-slate-800 placeholder-slate-300 border-none p-0 focus:ring-0 bg-transparent truncate"
            />
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
            onClick={() => onDuplicate(product)}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Duplikat"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5">
        
        {/* Core Inputs */}
        <div className="bg-slate-50/80 rounded-xl p-3 space-y-3 border border-slate-100">
          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="block text-slate-400 mb-1 text-[10px] uppercase font-bold tracking-wider">QTY Terjual</label>
              <div className={`bg-white border rounded-lg px-3 py-2 ${getInputClasses('quantity')}`}>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={formatNumber(product.quantity)}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  className="w-full text-center text-sm font-bold text-slate-700 outline-none bg-transparent font-mono"
                  placeholder="1"
                />
              </div>
              {errors.quantity && (
                <div className="flex items-center gap-1 mt-1 text-red-500">
                  <span className="text-[10px] font-medium leading-none">{errors.quantity}</span>
                </div>
              )}
            </div>
            <div className="w-2/3">
               <label className="block text-slate-400 mb-1 text-[10px] uppercase font-bold tracking-wider">Harga Modal / Unit</label>
               <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                <span className="text-slate-400 text-xs mr-2">Rp</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={formatNumber(product.costPrice)}
                  onChange={(e) => handlePriceChange('costPrice', e.target.value)}
                  className="w-full text-sm font-semibold text-slate-700 outline-none bg-transparent font-mono"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[10px] uppercase font-bold tracking-wider">Harga Jual (Coret) / Unit</label>
            <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <span className="text-slate-400 text-xs mr-2">Rp</span>
              <input 
                type="text" 
                inputMode="numeric"
                value={formatNumber(product.sellingPrice)}
                onChange={(e) => handlePriceChange('sellingPrice', e.target.value)}
                className="w-full text-base font-bold text-emerald-700 outline-none bg-transparent font-mono"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Configurations */}
        <div className="space-y-4">
          {/* Voucher */}
          <div>
            <div className="flex items-start gap-1.5 mb-2">
              <div className="p-1 rounded bg-orange-100 text-orange-600 mt-0.5"><Tag size={10} /></div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-600">Voucher Toko per Unit</span>
                <span className="text-[10px] text-slate-400 font-normal">(nominal atau %)</span>
              </div>
            </div>
            
            {/* New Voucher UI: Fixed Dropdown & Height */}
            <div className={`flex items-stretch border rounded-lg bg-white overflow-hidden transition-all ${
                (product.voucherType === VoucherType.PERCENT && errors.voucherAmount)
                ? 'border-red-500 ring-1 ring-red-500/20'
                : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
            }`}>
              {/* Type Selector */}
              <div className="relative w-[65px] bg-emerald-50 border-r border-emerald-100 shrink-0 hover:bg-emerald-100 transition-colors group/voucher">
                <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none z-10">
                   <ChevronDown size={12} className="text-emerald-400 group-hover/voucher:text-emerald-600" />
                </div>
                {/* Native Select with appearance-none to remove default arrow, full size, cursor pointer */}
                <select 
                  value={product.voucherType}
                  onChange={(e) => onUpdate(product.id, 'voucherType', e.target.value)}
                  className="appearance-none w-full h-full pl-2 pr-5 text-xs font-bold text-emerald-700 outline-none cursor-pointer bg-transparent text-center relative z-20"
                >
                  <option value={VoucherType.NOMINAL}>Rp</option>
                  <option value={VoucherType.PERCENT}>%</option>
                </select>
              </div>
              
              <div className="flex-1 relative flex items-center">
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={product.voucherType === VoucherType.NOMINAL ? formatNumber(Number(product.voucherAmount)) : (product.voucherAmount || '')}
                  onChange={(e) => {
                    product.voucherType === VoucherType.NOMINAL 
                      ? handlePriceChange('voucherAmount', e.target.value) 
                      : handlePercentChange('voucherAmount', e.target.value);
                  }}
                  className={`w-full px-3 py-2 text-sm font-mono outline-none bg-transparent transition-colors ${
                    product.voucherType === VoucherType.PERCENT && errors.voucherAmount 
                      ? 'text-red-600' 
                      : 'text-slate-700'
                  }`}
                  placeholder="0"
                />
              </div>
            </div>
            {product.voucherType === VoucherType.PERCENT && errors.voucherAmount && (
               <div className="flex justify-end mt-1">
                 <span className="text-[9px] text-red-500 font-medium">{errors.voucherAmount}</span>
               </div>
            )}
          </div>

          {/* Fees */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-1 rounded bg-indigo-100 text-indigo-600"><Wallet size={10} /></div>
              <span className="text-xs font-semibold text-slate-600">Biaya Platform & Lainnya</span>
            </div>
            
            <div className="space-y-2 pl-1">
              {[
                { 
                  label: 'Admin Fee', 
                  val: product.adminFeePercent, 
                  key: 'adminFeePercent', 
                  calculated: result.feeAdmin 
                },
                { 
                  label: 'Gratis Ongkir Xtra', 
                  val: product.freeShippingXtraPercent, 
                  key: 'freeShippingXtraPercent', 
                  hint: '(max 40,000)',
                  calculated: result.feeFreeShipping
                },
                { 
                  label: 'Promo Xtra', 
                  val: product.promoXtraPercent, 
                  key: 'promoXtraPercent', 
                  hint: '(max 60,000)',
                  calculated: result.feePromo
                },
              ].map((item: any) => (
                <div key={item.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm group/input">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">{item.label}</span>
                      {item.hint && <span className="text-[9px] text-slate-400 font-normal">{item.hint}</span>}
                    </div>
                    
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-slate-400 font-mono tracking-tight tabular-nums">
                        {formatCurrency(item.calculated)}
                      </span>
                      <div className={`flex items-center w-16 border-b transition-colors ${
                        errors[item.key] 
                          ? 'border-red-500' 
                          : 'border-slate-200 group-focus-within/input:border-emerald-500'
                      }`}>
                        <input 
                          type="text"
                          inputMode="decimal" 
                          value={item.val || ''}
                          onChange={(e) => handlePercentChange(item.key, e.target.value)}
                          className={`w-full py-1 text-right text-xs font-mono bg-transparent outline-none ${
                            errors[item.key] ? 'text-red-600' : 'text-slate-700'
                          }`}
                          placeholder="0"
                        />
                        <span className={`text-[10px] ml-1 ${errors[item.key] ? 'text-red-400' : 'text-slate-400'}`}>%</span>
                      </div>
                    </div>
                  </div>
                  {errors[item.key] && (
                    <div className="flex justify-end">
                      <span className="text-[9px] text-red-500 font-medium">{errors[item.key]}</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Order Processing Fee */}
              <div className="flex items-center justify-between text-sm pt-1">
                  <span className="text-xs text-slate-500">Biaya Proses Pesanan</span>
                  <div className="flex items-center w-24 border-b border-slate-200 focus-within:border-emerald-500 transition-colors">
                    <span className="text-[10px] text-slate-400 mr-1">Rp</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={formatNumber(product.orderProcessingFee)}
                      onChange={(e) => handlePriceChange('orderProcessingFee', e.target.value)}
                      className="w-full py-1 text-right text-xs font-mono bg-transparent outline-none text-slate-700"
                    />
                  </div>
              </div>

               {/* Biaya Operasional */}
               <div className="flex flex-col gap-1 pt-2 mt-1 border-t border-slate-100/50">
                  <div className="flex items-center justify-between text-sm group/input">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-tight">Biaya Operasional</span>
                    
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-slate-400 font-mono tracking-tight tabular-nums">
                        {formatCurrency(Math.abs(result.feeGrowlab))}
                      </span>
                      <div className={`flex items-center w-16 border-b transition-colors ${
                        errors['growlabFeePercent'] 
                          ? 'border-red-500' 
                          : 'border-slate-200 group-focus-within/input:border-emerald-500'
                      }`}>
                        <input 
                          type="text"
                          inputMode="decimal" 
                          value={product.growlabFeePercent || ''}
                          onChange={(e) => handlePercentChange('growlabFeePercent', e.target.value)}
                          className={`w-full py-1 text-right text-xs font-mono bg-transparent outline-none ${
                            errors['growlabFeePercent'] ? 'text-red-600' : 'text-slate-700'
                          }`}
                          placeholder="0"
                        />
                        <span className={`text-[10px] ml-1 ${errors['growlabFeePercent'] ? 'text-red-400' : 'text-slate-400'}`}>%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biaya Growlab (%) */}
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between text-sm group/input">
                    <span className="text-xs text-emerald-700 font-bold uppercase tracking-tight">Biaya Growlab</span>
                    
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-slate-400 font-mono tracking-tight tabular-nums">
                        {formatCurrency(Math.abs(result.feeGrowlabService))}
                      </span>
                      <div className={`flex items-center w-16 border-b transition-colors ${
                        errors['growlabServicePercent'] 
                          ? 'border-red-500' 
                          : 'border-slate-200 group-focus-within/input:border-emerald-500'
                      }`}>
                        <input 
                          type="text"
                          inputMode="decimal" 
                          value={product.growlabServicePercent || ''}
                          onChange={(e) => handlePercentChange('growlabServicePercent', e.target.value)}
                          className={`w-full py-1 text-right text-xs font-mono bg-transparent outline-none ${
                            errors['growlabServicePercent'] ? 'text-red-600' : 'text-slate-700'
                          }`}
                          placeholder="0"
                        />
                        <span className={`text-[10px] ml-1 ${errors['growlabServicePercent'] ? 'text-red-400' : 'text-slate-400'}`}>%</span>
                      </div>
                    </div>
                  </div>
                  {errors['growlabServicePercent'] && (
                    <div className="flex justify-end">
                      <span className="text-[9px] text-red-500 font-medium">{errors['growlabServicePercent']}</span>
                    </div>
                  )}
                </div>

            </div>
          </div>
        </div>
      </div>

      {/* Results Footer */}
      <div className="bg-slate-900 p-5 mt-auto text-white">
        
        {/* Financial Breakdown Section */}
        <div className="space-y-2 mb-5 border-b border-slate-700 pb-4">
          {/* Row 1: Shopee Context */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 text-xs">Potongan Shopee</span>
            <span className="font-mono text-xs text-red-400">-{formatCurrency(result.totalShopeeFees)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 text-xs">Estimasi Penghasilan<br />Bersih</span>
            <span className="font-mono text-xs text-slate-200">{formatCurrency(result.netIncome)}</span>
          </div>

          {/* Row 2: After Biaya Operasional & Service Growlab */}
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800 border-dashed">
            <span className="text-blue-300 text-xs font-medium">Net (Stlh Ops & Growlab)</span>
            <span className="font-mono font-medium text-blue-300">{formatCurrency(result.netIncomeAfterGrowlab)}</span>
          </div>
        </div>

        {/* KPI Section */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Main KPI: Profit */}
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-1.5 mb-1">
               <div className="p-1 rounded-full bg-emerald-500 text-white"><DollarSign size={10} strokeWidth={3} /></div>
               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Profit</span>
             </div>
             <p className={`${getProfitFontSize(profitString)} font-bold font-mono tracking-tight break-words whitespace-nowrap leading-none ${result.profit >= 0 ? 'text-white' : 'text-red-400'}`}>
               {profitString}
             </p>
          </div>
          
          {/* Secondary KPIs: Margin & ROAS */}
          <div className="flex flex-col gap-3 items-end flex-shrink-0">
            
            {/* Margin */}
            <div className="text-right">
               <span className={`text-xl font-bold font-mono block leading-none ${result.netProfitMargin >= 20 ? 'text-emerald-400' : result.netProfitMargin > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.netProfitMargin.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Margin</span>
            </div>

            {/* ROAS */}
            <div className="text-right">
               <span className="text-xl font-bold font-mono text-slate-300 block leading-none">
                {result.profit > 0 && result.minROAS > 0 && isFinite(result.minROAS) ? `${result.minROAS.toFixed(1)}x` : '-'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Min ROAS</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};