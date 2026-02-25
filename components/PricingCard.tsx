
import React, { useMemo } from 'react';
import { Trash2, TrendingUp, Wallet, ShoppingBag, Tag, Copy, ChevronDown, DollarSign, Target } from 'lucide-react';
import { ProductData, VoucherType, MarginType } from '../types';
import { formatCurrency, calculateProductMetrics, calculateRequiredSellingPrice, formatNumber, parseNumberInput } from '../utils';

interface PricingCardProps {
  product: ProductData;
  index: number;
  onUpdate: (id: string, field: keyof ProductData, value: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (product: ProductData) => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ product, index, onUpdate, onDelete, onDuplicate }) => {
  
  const calculatedSellingPrice = useMemo(() => calculateRequiredSellingPrice(product), [product]);

  // Apply the calculated selling price to get the full metrics display
  const metrics = useMemo(() => {
    return calculateProductMetrics({ ...product, sellingPrice: calculatedSellingPrice });
  }, [product, calculatedSellingPrice]);

  const handlePriceChange = (field: keyof ProductData, value: string) => {
    const numValue = parseNumberInput(value);
    onUpdate(product.id, field, numValue);
  };

  const handlePercentChange = (field: keyof ProductData, value: string) => {
    let clean = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
    onUpdate(product.id, field, clean);
  };

  const feeItems = [
    { label: 'Admin Fee', key: 'adminFeePercent', nominal: metrics.feeAdmin },
    { label: 'Gratis Ongkir Xtra', key: 'freeShippingXtraPercent', nominal: metrics.feeFreeShipping },
    { label: 'Promo Xtra', key: 'promoXtraPercent', nominal: metrics.feePromo },
    { label: 'Biaya Operasional', key: 'growlabFeePercent', nominal: metrics.feeGrowlab },
    { label: 'Biaya Growlab', key: 'growlabServicePercent', nominal: metrics.feeGrowlabService }
  ];

  return (
    <div className="group relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-emerald-200 hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

      <div className="pt-5 px-5 pb-2 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Target size={20} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">Pricing #{index + 1}</span>
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
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5">
        
        {/* Target Margin Input */}
        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <label className="block text-blue-600 mb-2 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} /> Target Profit (Net Margin)
            </label>
            <div className="flex items-stretch border border-blue-200 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <div className="relative w-[65px] bg-blue-100 border-r border-blue-200 shrink-0">
                    <select 
                        value={product.targetMarginType}
                        onChange={(e) => onUpdate(product.id, 'targetMarginType', e.target.value)}
                        className="appearance-none w-full h-full pl-2 pr-4 text-xs font-bold text-blue-700 outline-none cursor-pointer bg-transparent text-center"
                    >
                        <option value={MarginType.NOMINAL}>Rp</option>
                        <option value={MarginType.PERCENT}>%</option>
                    </select>
                    <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                </div>
                <input 
                    type="text" 
                    inputMode="decimal"
                    value={product.targetMarginType === MarginType.NOMINAL ? formatNumber(Number(product.targetMarginValue)) : (product.targetMarginValue || '')}
                    onChange={(e) => {
                        product.targetMarginType === MarginType.NOMINAL 
                            ? handlePriceChange('targetMarginValue', e.target.value) 
                            : handlePercentChange('targetMarginValue', e.target.value);
                    }}
                    className="flex-1 px-3 py-2 text-base font-bold text-blue-900 outline-none bg-transparent font-mono"
                    placeholder="0"
                />
            </div>
            {product.targetMarginType === MarginType.PERCENT && metrics.profit !== 0 && (
                <p className="text-[10px] text-blue-400 mt-1 font-medium italic">
                    Setara {formatCurrency(metrics.profit)} per unit
                </p>
            )}
        </div>

        {/* Cost Input */}
        <div className="space-y-3">
          <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Harga Modal / Unit</label>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
            <span className="text-slate-400 text-xs mr-2">Rp</span>
            <input 
              type="text" 
              inputMode="numeric"
              value={formatNumber(product.costPrice)}
              onChange={(e) => handlePriceChange('costPrice', e.target.value)}
              className="w-full text-base font-semibold text-slate-700 outline-none bg-transparent font-mono"
              placeholder="0"
            />
          </div>
        </div>

        {/* Configurations Similar to ProductCard */}
        <div className="space-y-4">
          {/* Fees Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-1 rounded bg-indigo-100 text-indigo-600"><Wallet size={10} /></div>
              <span className="text-xs font-semibold text-slate-600">Potongan & Biaya Lainnya</span>
            </div>
            
            <div className="space-y-3 pl-1">
                {feeItems.map((item, idx) => (
                    <React.Fragment key={item.key}>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[11px] text-slate-500">{item.label}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-400 font-mono tracking-tighter italic">
                                      {formatCurrency(item.nominal)}
                                    </span>
                                    <div className="flex items-center w-16 border-b border-slate-200 focus-within:border-blue-500 transition-colors">
                                        <input 
                                            type="text"
                                            inputMode="decimal" 
                                            value={(product as any)[item.key] || ''}
                                            onChange={(e) => handlePercentChange(item.key as any, e.target.value)}
                                            className="w-full py-0.5 text-right text-xs font-mono bg-transparent outline-none text-slate-700"
                                            placeholder="0"
                                        />
                                        <span className="text-[10px] ml-1 text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {idx === 2 && (
                            <div className="flex items-center justify-between text-sm pt-1">
                              <span className="text-[11px] text-slate-500">Biaya Proses Pesanan</span>
                              <div className="flex items-center w-28 border-b border-slate-200 focus-within:border-blue-500 transition-colors">
                                <span className="text-[10px] text-slate-400 mr-1">Rp</span>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  value={formatNumber(product.orderProcessingFee)}
                                  onChange={(e) => handlePriceChange('orderProcessingFee', e.target.value)}
                                  className="w-full py-0.5 text-right text-xs font-mono bg-transparent outline-none text-slate-700"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result Footer: The Selling Price Output */}
      <div className="bg-slate-900 p-6 mt-auto text-white">
        <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-full bg-blue-500 text-white"><DollarSign size={14} strokeWidth={3} /></div>
            <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.15em]">Hasil Harga Jual Ideal</span>
        </div>
        
        <div className="mb-4">
            <p className="text-4xl font-black font-mono tracking-tighter text-white">
                {formatCurrency(calculatedSellingPrice)}
            </p>
        </div>

        <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
            <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Net</span>
                <span className="text-sm font-mono font-bold text-slate-200">{formatCurrency(metrics.netIncomeAfterGrowlab)}</span>
            </div>
            <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Profit Bersih</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(metrics.profit)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
