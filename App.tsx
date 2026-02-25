
import React, { useState, useMemo } from 'react';
import { 
  Plus, Info, AlertCircle, User, Lock, ArrowRight, TrendingUp, 
  PieChart, Coins, ArrowLeft, Calculator, Building2, Users, 
  Package, Zap, ChevronRight, Upload, Image as ImageIcon, Loader2, CheckCircle2,
  Target, LayoutGrid, Sparkles, X, Trash2, Eye, HelpCircle, ChevronUp, DollarSign
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ProductData, VoucherType, MarginType } from './types';
import { ProductCard } from './components/ProductCard';
import { PricingCard } from './components/PricingCard';
import { calculateProductMetrics, formatCurrency, formatNumber, parseNumberInput, calculateRequiredSellingPrice } from './utils';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const GrowlabLogo = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <rect width="100" height="100" rx="20" fill={color === "currentColor" ? "transparent" : color} />
    <path 
      d="M30 35C30 32.2386 32.2386 30 35 30H65C67.7614 30 70 32.2386 70 35V45L55 35V55L70 45V65C70 67.7614 67.7614 70 65 70H35C32.2386 70 30 67.7614 30 65V35Z" 
      fill={color === "currentColor" ? "#022c22" : "white"} 
    />
  </svg>
);

interface AnalysisItem {
  totalEarnings: number;
  subTotal: number;
  quantity: number;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'ops-setup' | 'nav-hub' | 'payment-analyzer' | 'dashboard' | 'pricing-calculator'>('login');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [monthlyGmv, setMonthlyGmv] = useState(0);
  const [monthlySalaries, setMonthlySalaries] = useState(0);
  const [monthlyPackaging, setMonthlyPackaging] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [monthlyUtilities, setMonthlyUtilities] = useState(0);
  const [monthlyGrowlabFixed, setMonthlyGrowlabFixed] = useState(0);

  // Analyzer States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisItem[] | null>(null);
  const [analyzerUnitCost, setAnalyzerUnitCost] = useState(0);
  const [analyzerGrowlabPercent, setAnalyzerGrowlabPercent] = useState<string>('0');
  const [uploadedImages, setUploadedImages] = useState<{id: string, url: string, base64: string, type: string}[]>([]);

  const calculatedOpsRatio = useMemo(() => {
    const totalCosts = monthlySalaries + monthlyPackaging + monthlyRent + monthlyUtilities + monthlyGrowlabFixed;
    if (monthlyGmv <= 0) return 0;
    return (totalCosts / monthlyGmv) * 100;
  }, [monthlyGmv, monthlySalaries, monthlyPackaging, monthlyRent, monthlyUtilities, monthlyGrowlabFixed]);

  const INITIAL_PRODUCT: ProductData = {
    id: '',
    name: '',
    quantity: 1,
    costPrice: 0,
    sellingPrice: 0,
    voucherType: VoucherType.NOMINAL,
    voucherAmount: 0,
    adminFeePercent: 0,
    freeShippingXtraPercent: 0,
    promoXtraPercent: 0,
    orderProcessingFee: 1250,
    growlabFeePercent: calculatedOpsRatio.toFixed(2),
    growlabServicePercent: 0,
    targetMarginType: MarginType.PERCENT,
    targetMarginValue: 20
  };

  const [products, setProducts] = useState<ProductData[]>([
    { ...INITIAL_PRODUCT, id: generateId() }
  ]);

  const [pricingProducts, setPricingProducts] = useState<ProductData[]>([
    { ...INITIAL_PRODUCT, id: generateId() }
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'growlab' && password === 'growlab35') {
      setIsAuthenticated(true);
      setCurrentView('ops-setup');
      setLoginError('');
    } else {
      setLoginError('Username atau password salah.');
    }
  };

  const handleFinishOpsSetup = () => {
    const updatedOps = calculatedOpsRatio.toFixed(2);
    setProducts(prev => prev.map(p => ({ ...p, growlabFeePercent: updatedOps })));
    setPricingProducts(prev => prev.map(p => ({ ...p, growlabFeePercent: updatedOps })));
    setCurrentView('nav-hub');
  };

  const handleFinishAnalyzer = () => {
    setAnalysisResult(null);
    setUploadedImages([]);
    setAnalyzerUnitCost(0);
    setAnalyzerGrowlabPercent('0');
    setCurrentView('nav-hub');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setUploadedImages([{ id: generateId(), url: reader.result as string, base64, type: file.type }]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (id: string) => {
    setUploadedImages([]);
    if (analysisResult) setAnalysisResult(null);
  };

  const runAnalysis = async () => {
    if (uploadedImages.length === 0) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imageParts = uploadedImages.map(img => ({
        inlineData: { mimeType: img.type, data: img.base64 },
      }));
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            ...imageParts,
            { text: "Extract 'Total Penghasilan' (Earnings), 'Sub Total' (Order Total), and 'Jumlah Pesanan' (Quantity) from this Shopee payment screenshot. Return a JSON object: {\"totalEarnings\": number, \"subTotal\": number, \"quantity\": number}. Use numbers only, no currency symbols." },
          ],
        },
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      setAnalysisResult([result]);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzerMetrics = useMemo(() => {
    if (!analysisResult || analysisResult.length === 0) return null;
    const totalEarningsUnit = analysisResult.reduce((acc, curr) => acc + (curr.totalEarnings / (curr.quantity || 1)), 0);
    const subTotalUnit = analysisResult.reduce((acc, curr) => acc + (curr.subTotal / (curr.quantity || 1)), 0);
    const opsNominal = analysisResult.reduce((acc, curr) => {
        const unitSub = curr.subTotal / (curr.quantity || 1);
        return acc + ((calculatedOpsRatio / 100) * unitSub);
    }, 0);
    const getNumberLocal = (val: string): number => {
      const normalized = val.replace(',', '.');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : parsed;
    };
    const growlabFeeAmount = totalEarningsUnit * (getNumberLocal(analyzerGrowlabPercent) / 100);
    const earningsAfterGrowlab = totalEarningsUnit - growlabFeeAmount;
    const profit = earningsAfterGrowlab - opsNominal - analyzerUnitCost;
    const profitPercent = subTotalUnit > 0 ? (profit / subTotalUnit) : 0;
    const minRoas = profitPercent > 0 ? (1 / profitPercent) : 0;
    return { totalEarningsUnit, subTotalUnit, opsNominal, growlabFeeAmount, profit, profitPercent: profitPercent * 100, minRoas };
  }, [analysisResult, analyzerUnitCost, analyzerGrowlabPercent, calculatedOpsRatio]);

  const addProduct = (type: 'margin' | 'pricing' = 'margin') => {
    const list = type === 'margin' ? products : pricingProducts;
    if (list.length >= 4) return;
    const newId = generateId();
    const newProd = { ...INITIAL_PRODUCT, id: newId, growlabFeePercent: calculatedOpsRatio.toFixed(2) };
    if (type === 'margin') setProducts([...products, newProd]);
    else setPricingProducts([...pricingProducts, newProd]);
  };

  const duplicateProduct = (sourceProduct: ProductData, type: 'margin' | 'pricing' = 'margin') => {
    const list = type === 'margin' ? products : pricingProducts;
    if (list.length >= 4) return;
    const newId = generateId();
    const newProduct = { ...sourceProduct, id: newId, name: sourceProduct.name ? `${sourceProduct.name} (Copy)` : '(Copy)' };
    if (type === 'margin') setProducts([...products, newProduct]);
    else setPricingProducts([...pricingProducts, newProduct]);
  };

  const removeProduct = (id: string, type: 'margin' | 'pricing' = 'margin') => {
    const list = type === 'margin' ? products : pricingProducts;
    if (list.length === 1) return;
    if (type === 'margin') setProducts(products.filter(p => p.id !== id));
    else setPricingProducts(pricingProducts.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof ProductData, value: any, type: 'margin' | 'pricing' = 'margin') => {
    if (type === 'margin') setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    else setPricingProducts(pricingProducts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const totalSummary = products.reduce((acc, curr) => {
    const metrics = calculateProductMetrics(curr);
    const qty = curr.quantity > 0 ? curr.quantity : 1;
    return {
      revenue: acc.revenue + metrics.priceAfterVoucher,
      fees: acc.fees + metrics.totalShopeeFees + metrics.feeGrowlab + metrics.feeGrowlabService,
      netIncome: acc.netIncome + metrics.netIncome,
      profit: acc.profit + metrics.profit,
      modal: acc.modal + (curr.costPrice * qty)
    };
  }, { revenue: 0, fees: 0, netIncome: 0, profit: 0, modal: 0 });

  const pricingSummary = pricingProducts.reduce((acc, curr) => {
    const targetPrice = calculateRequiredSellingPrice(curr);
    const metrics = calculateProductMetrics({ ...curr, sellingPrice: targetPrice });
    const qty = curr.quantity > 0 ? curr.quantity : 1;
    return {
      revenue: acc.revenue + metrics.priceAfterVoucher,
      profit: acc.profit + metrics.profit
    };
  }, { revenue: 0, profit: 0 });

  if (currentView === 'login') {
    return (
      <div className="min-h-screen flex bg-white font-sans">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 relative overflow-hidden text-white p-12 xl:p-20 flex-col justify-between">
          <div className="absolute top-0 right-0 w-full h-full opacity-20" 
               style={{backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(to right, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
          </div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400 rounded-full blur-[100px] opacity-10"></div>

          <div className="relative z-10">
            <div className="mb-8 xl:mb-12">
              <span className="font-black text-3xl xl:text-4xl tracking-tight text-white">Growlab <span className="text-emerald-400">Tools</span></span>
            </div>
            
            <h1 className="text-6xl xl:text-8xl font-black leading-[0.9] mb-8 xl:mb-12 tracking-tighter">
              Maximize <br/>
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Profit.</span>
            </h1>
            <div className="text-teal-50 text-xl xl:text-2xl max-w-xl leading-relaxed border-l-[6px] border-emerald-500 pl-8 font-medium">
              <p className="mb-4">Platform kalkulasi presisi untuk seller Shopee. Tiga fitur utama:</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                  <span>Hitung margin</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                  <span>Hitung ROAS minimal agar iklan ga boncos</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                  <span>Hitung harga jual sesuai keuntungan yang Anda harapkan</span>
                </li>
              </ul>
              <p>Scale-up online shop Anda tanpa keraguan !</p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6 xl:gap-8 mt-8 xl:mt-12">
            <div className="bg-white/5 backdrop-blur-md p-6 xl:p-7 rounded-3xl border border-white/10 hover:bg-white/10 transition-all transform hover:-translate-y-1">
              <PieChart className="text-emerald-400 mb-4" size={32} />
              <h3 className="font-black text-xl xl:text-2xl text-white">Analisa Biaya</h3>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-6 xl:p-7 rounded-3xl border border-white/10 hover:bg-white/10 transition-all transform hover:-translate-y-1">
              <Coins className="text-amber-400 mb-4" size={32} />
              <h3 className="font-black text-xl xl:text-2xl text-white">Profit</h3>
            </div>
          </div>

          <div className="relative z-10">
            <div className="h-px w-12 bg-emerald-500/30 mb-6"></div>
            <div className="text-xs text-teal-300/40 font-bold tracking-[0.2em] uppercase">
              PT GROWLAB DIGITAL SOLUTION © 2026
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
          <div className="w-full max-w-xl">
            <div className="bg-white p-10 lg:p-12 xl:p-16 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.1)] border border-slate-100">
              <div className="text-center mb-10 xl:mb-16">
                <div className="lg:hidden flex justify-center mb-8">
                   <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl p-3">
                    <GrowlabLogo className="w-full h-full" color="white" />
                  </div>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">Selamat Datang</h2>
                <p className="text-slate-500 mt-4 text-base lg:text-lg font-medium">Silakan masukkan username dan password Anda.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-8">
                {loginError && (
                  <div className="bg-red-50 border-l-[6px] border-red-500 text-red-700 px-6 py-4 rounded-r-xl text-base flex items-center gap-3 font-bold">
                    <AlertCircle size={20} />
                    {loginError}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600">
                        <User size={24} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-14 pr-6 py-4 lg:py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-slate-800 outline-none text-lg"
                        placeholder="Masukkan username"
                        required
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600">
                        <Lock size={24} className="text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-14 pr-6 py-4 lg:py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-slate-800 outline-none text-lg"
                        placeholder="Masukkan password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-4 bg-slate-900 hover:bg-emerald-600 text-white font-black py-5 lg:py-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-2xl hover:shadow-emerald-500/40 text-xl mt-4 uppercase tracking-widest"
                >
                  Login <ArrowRight size={28} strokeWidth={4} />
                </button>
              </form>
            </div>
            <div className="mt-12 text-center">
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">
                PT GROWLAB DIGITAL SOLUTION © 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'ops-setup') {
    const totalOpsCost = monthlySalaries + monthlyPackaging + monthlyRent + monthlyUtilities + monthlyGrowlabFixed;
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string) => {
      const numeric = parseNumberInput(value);
      setter(numeric);
    };
    return (
      <div className="min-h-screen bg-[#F0FDF4] flex flex-col items-center justify-center py-24 px-12">
        <div className="max-w-4xl w-full flex flex-col items-center">
          <div className="w-full flex justify-start items-center mb-16">
            <button onClick={() => setCurrentView('login')} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all"><ArrowLeft size={24} /></button>
          </div>
          <div className="w-full text-center mb-20">
            <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">Yuk Hitung Biaya Operasional Online Shop mu</h1>
            <p className="text-slate-500 text-2xl font-medium">Gunakan data real 1 bulan terakhir untuk akurasi margin.</p>
          </div>
          <div className="w-full space-y-24">
            <div className="bg-amber-50 border-l-[8px] border-amber-500 p-10 rounded-r-[2.5rem] flex items-center gap-8 shadow-sm">
              <div className="bg-amber-500 p-3 rounded-full text-white shadow-md"><AlertCircle size={32} /></div>
              <div>
                <h3 className="text-amber-950 font-black text-2xl leading-tight">Input data 1 bulan terakhir untuk menghitung rasio biaya operasional.</h3>
                <p className="text-amber-900/60 text-lg mt-2 font-bold tracking-tight">Data ini menentukan Biaya Operasional otomatis di kalkulator produk.</p>
              </div>
            </div>
            <div className="space-y-24">
              <div className="max-w-3xl mx-auto w-full group">
                <label className="flex items-center justify-center gap-3 text-lg font-black text-emerald-600 uppercase tracking-widest mb-8"><Coins size={20} /> Omzet Pesanan Siap Dikirim (1 Bln Terakhir)</label>
                <div className="relative border-b-[5px] border-slate-100 group-focus-within:border-emerald-500 transition-all pb-6">
                  <span className="absolute left-0 bottom-6 font-black text-slate-200 text-5xl">Rp</span>
                  <input type="text" inputMode="numeric" value={formatNumber(monthlyGmv)} onChange={(e) => handleInputChange(setMonthlyGmv, e.target.value)} className="w-full text-center bg-transparent outline-none text-[6rem] font-black text-slate-900 placeholder-slate-100 tracking-tighter" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
                {[
                  { label: 'Total Gaji Karyawan', value: monthlySalaries, setter: setMonthlySalaries, icon: Users, color: 'text-blue-500' },
                  { label: 'Total Biaya Packaging', value: monthlyPackaging, setter: setMonthlyPackaging, icon: Package, color: 'text-orange-500' },
                  { label: 'Sewa Gudang / Kantor', value: monthlyRent, setter: setMonthlyRent, icon: Building2, color: 'text-indigo-500' },
                  { label: 'Listrik, Air, & Wifi', value: monthlyUtilities, setter: setMonthlyUtilities, icon: Zap, color: 'text-amber-500' },
                  { label: 'Biaya Optimasi Growlab', value: monthlyGrowlabFixed, setter: setMonthlyGrowlabFixed, icon: TrendingUp, color: 'text-teal-500', hint: 'Isi jika hanya besaran biaya optimasi Growlab dalam bentuk fix, bukan %' }
                ].map((item, i) => (
                  <div key={i} className={`group ${item.label === 'Biaya Optimasi Growlab' ? 'md:col-span-2 max-w-xl mx-auto w-full' : ''}`}>
                    <label className="flex items-center gap-3 text-base font-black text-slate-500 uppercase tracking-widest mb-4 group-hover:text-slate-800 transition-colors">
                      <item.icon size={18} className={item.color} strokeWidth={2.5} /> {item.label}
                    </label>
                    {item.hint && <div className="flex items-start gap-4 mb-6 bg-teal-50/70 p-5 rounded-2xl border border-teal-100 shadow-sm"><Info size={20} className="text-teal-600 mt-0.5 shrink-0" /><p className="text-base text-teal-800 font-bold leading-relaxed tracking-tight">{item.hint}</p></div>}
                    <div className="relative border-b-[3px] border-slate-100 group-focus-within:border-emerald-400 transition-all pb-3"><span className="absolute left-0 bottom-3 text-xl font-black text-slate-200">Rp</span><input type="text" inputMode="numeric" value={formatNumber(item.value)} onChange={(e) => handleInputChange(item.setter, e.target.value)} className="w-full pl-12 bg-transparent outline-none text-4xl font-black text-slate-900 transition-all font-mono" placeholder="0" /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-24 flex flex-col items-center">
              <div className="bg-slate-900 rounded-[4.5rem] p-20 text-white shadow-[0_50px_120px_-30px_rgba(0,0,0,0.4)] w-full max-w-3xl relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48"></div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.6em] mb-16 flex items-center justify-center gap-6"><div className="w-16 h-[2px] bg-emerald-500 rounded-full"></div> Hasil Kalkulasi <div className="w-16 h-[2px] bg-emerald-500 rounded-full"></div></h3>
                <div className="mb-20"><span className="text-base font-black text-slate-400 uppercase tracking-[0.2em] block mb-6">Total Biaya Pengeluaran</span><p className="text-7xl font-black font-mono tracking-tighter text-white">{formatCurrency(totalOpsCost)}</p></div>
                <div className="py-16 border-y border-white/5"><div className="flex items-center justify-center gap-4 mb-10"><span className="text-lg font-black text-emerald-400 uppercase tracking-[0.3em]">Rasio Biaya Operasional</span><div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div></div><div className="flex items-baseline justify-center gap-6"><span className="text-[14rem] font-black text-white tracking-tighter leading-none">{calculatedOpsRatio.toFixed(1)}</span><span className="text-7xl font-black text-emerald-500">%</span></div><p className="text-xl text-slate-500 mt-14 leading-relaxed font-bold max-w-md mx-auto">Setiap produk otomatis dibebani <span className="text-emerald-400 text-2xl">{calculatedOpsRatio.toFixed(1)}%</span> biaya operasional untuk menutup pengeluaran bulanan.</p></div>
                <button disabled={monthlyGmv <= 0} onClick={handleFinishOpsSetup} className={`w-full py-10 rounded-[3rem] font-black text-3xl flex items-center justify-center gap-6 transition-all duration-500 transform active:scale-95 mt-20 ${monthlyGmv > 0 ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_30px_70px_-15px_rgba(16,185,129,0.6)]' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}>Lanjut ke Pilih Menu <ChevronRight size={36} strokeWidth={4} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'nav-hub') {
    return (
      <div className="min-h-screen bg-[#F0FDF4] flex flex-col items-center justify-center py-20 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-100 rounded-full blur-[100px] -ml-48 -mb-48 opacity-50"></div>
        <div className="max-w-6xl w-full relative z-10">
          <div className="flex justify-start mb-16">
            <button onClick={() => setCurrentView('ops-setup')} className="flex items-center gap-3 text-slate-500 hover:text-emerald-600 font-bold transition-all group"><div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md"><ArrowLeft size={20} /></div>Kembali ke Hitung Biaya Operasional</button>
          </div>
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full font-black text-sm uppercase tracking-[0.3em] mb-8">
              <Sparkles size={16} /> Solusi Profit Terbaik Untukmu
            </div>
            <h1 className="text-7xl font-black text-slate-900 tracking-tight leading-tight mb-4">Pilih Cara Kalkulasimu</h1>
            <p className="text-slate-500 text-2xl font-medium max-w-2xl mx-auto">Analisa data real dari pesanan yang sudah ada, atau tentukan target profit masa depan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button onClick={() => setCurrentView('payment-analyzer')} className="group relative bg-slate-900 rounded-[3rem] p-10 text-left hover:bg-slate-800 shadow-xl transition-all duration-500 transform hover:-translate-y-3">
              <div className="relative z-10 text-white">
                <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl mb-8 group-hover:scale-110 transition-transform duration-500"><ImageIcon size={40} strokeWidth={2.5} /></div>
                <h3 className="text-3xl font-black mb-4 leading-tight">AI Payment Analyzer</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8">Ekstrak data otomatis dari screenshot "Detail Penghasilan" Shopee. Cepat & Akurat.</p>
                <div className="flex items-center gap-3 text-emerald-400 font-black text-base uppercase tracking-widest group-hover:gap-6 transition-all">Analisa AI <ArrowRight size={20} strokeWidth={3} /></div>
              </div>
            </button>
            <button onClick={() => setCurrentView('dashboard')} className="group relative bg-slate-900 rounded-[3rem] p-10 text-left hover:bg-slate-800 shadow-xl transition-all duration-500 transform hover:-translate-y-3">
              <div className="relative z-10 text-white">
                <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl mb-8 group-hover:scale-110 transition-transform duration-500"><Calculator size={40} strokeWidth={2.5} /></div>
                <h3 className="text-3xl font-black mb-4 leading-tight">Kalkulator Margin</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8">Hitung estimasi potongan Shopee, penghasilan bersih, margin, dan ROAS BEP.</p>
                <div className="flex items-center gap-3 text-emerald-400 font-black text-base uppercase tracking-widest group-hover:gap-6 transition-all">Hitung Margin <ArrowRight size={20} strokeWidth={3} /></div>
              </div>
            </button>
            <button onClick={() => setCurrentView('pricing-calculator')} className="group relative bg-slate-900 rounded-[3rem] p-10 text-left hover:bg-slate-800 shadow-xl transition-all duration-500 transform hover:-translate-y-3">
              <div className="relative z-10 text-white">
                <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl mb-8 group-hover:scale-110 transition-transform duration-500"><DollarSign size={40} strokeWidth={2.5} /></div>
                <h3 className="text-3xl font-black mb-4 leading-tight">Kalkulator Harga Jual</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8">Tentukan harga jual ideal berdasarkan target keuntungan (nominal atau %) yang Anda inginkan.</p>
                <div className="flex items-center gap-3 text-emerald-400 font-black text-base uppercase tracking-widest group-hover:gap-6 transition-all">Cari Harga Jual <ArrowRight size={20} strokeWidth={3} /></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'payment-analyzer') {
    const globalSummary = analysisResult?.reduce((acc, curr) => ({ totalEarnings: acc.totalEarnings + curr.totalEarnings, subTotal: acc.subTotal + curr.subTotal, quantity: acc.quantity + curr.quantity }), { totalEarnings: 0, subTotal: 0, quantity: 0 });
    return (
      <div className="min-h-screen bg-[#F0FDF4] py-16 px-6 flex flex-col items-center">
        <div className="max-w-5xl w-full">
          <div className="flex items-center justify-between mb-12">
            <button onClick={() => handleFinishAnalyzer()} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all"><ArrowLeft size={24} /></button>
            <div className="text-center"><h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">Payment Detail Analyzer</h1><p className="text-slate-500 text-xl font-medium mt-2">Gunakan AI untuk menghitung profit pesanan Anda</p></div><div className="w-14"></div>
          </div>
          <div className="mb-12 w-full flex justify-center"><button onClick={() => setShowExample(!showExample)} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-200 shadow-sm"><Eye size={20} /> {showExample ? 'Tutup Contoh Gambar' : 'Lihat Contoh Screenshot yang Benar'}</button></div>
          {showExample && (<div className="mb-16 animate-in fade-in zoom-in duration-300 w-full max-w-4xl mx-auto"><div className="mb-6 bg-blue-50 border-l-[6px] border-blue-500 p-6 rounded-r-3xl flex items-start gap-4 shadow-sm"><div className="p-2 bg-blue-500 rounded-full text-white mt-1"><Info size={24} /></div><div><h3 className="text-blue-900 font-black text-lg uppercase tracking-tight">Cara mendapatkan screenshot:</h3><p className="text-blue-800 font-medium text-lg leading-relaxed mt-1">Contoh screenshot yang benar bisa didapatkan dari Shopee Seller Center di bagian <strong>Beranda &gt; Pesanan &gt; Pesanan Saya &gt; Selesai &gt; Periksa Rincian</strong>.</p></div></div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden font-sans text-[13px] text-slate-600">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white">
                    <DollarSign size={12} strokeWidth={3} />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Informasi Pembayaran</span>
                </div>
                <button className="text-blue-500 hover:underline">Lihat riwayat transaksi</button>
              </div>
              
              <div className="p-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-50">
                      <th className="py-2 font-normal w-8">No.</th>
                      <th className="py-2 font-normal">Produk</th>
                      <th className="py-2 font-normal text-right">Harga Satuan</th>
                      <th className="py-2 font-normal text-right">Jumlah</th>
                      <th className="py-2 font-normal text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-4 align-top">1</td>
                      <td className="py-4">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-black flex items-center justify-center rounded shrink-0 overflow-hidden">
                            <div className="text-[8px] text-white text-center leading-tight p-1">MOTIF RANDOM</div>
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium mb-1">sprei 180x200x30 | sprei homemade</p>
                            <p className="text-slate-400 text-[11px]">Variasi: Random</p>
                            <p className="text-slate-400 text-[11px]">Kode Variasi: PKTSP180-30</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right align-top">82.000</td>
                      <td className="py-4 text-right align-top">10</td>
                      <td className="py-4 text-right align-top">820.000</td>
                    </tr>
                  </tbody>
                </table>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-dashed border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-end">
                    <span className="bg-white pl-2 text-slate-400 flex items-center gap-1 cursor-pointer hover:text-slate-600">
                      Sembunyikan Rincian Penghasilan <ChevronUp size={14} />
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3 mt-2">
                  <div className="flex justify-between w-full max-w-[400px]">
                    <span className="font-bold text-slate-800">Subtotal Pesanan</span>
                    <span className="text-slate-800">Rp820.000</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[400px] text-slate-400">
                    <span>Harga Produk</span>
                    <span>Rp820.000</span>
                  </div>
                  
                  <div className="flex justify-between w-full max-w-[400px]">
                    <span className="font-bold text-slate-800">Subtotal Ongkos Kirim</span>
                    <span className="text-slate-800">Rp0</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[400px] text-slate-400">
                    <span>Ongkir Dibayar Pembeli</span>
                    <span>Rp0</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[400px] text-slate-400">
                    <span>Ongkos Kirim yang Dibayarkan ke Jasa Kirim</span>
                    <span>-Rp237.083</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[400px] text-slate-400">
                    <span>Potongan Ongkos Kirim dari Shopee</span>
                    <span>Rp237.083</span>
                  </div>

                  <div className="flex justify-between w-full max-w-[400px]">
                    <span className="font-bold text-slate-800">Biaya Lainnya</span>
                    <span className="text-slate-800">-Rp106.950</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[400px] text-slate-400">
                    <span className="flex items-center gap-1">Biaya Administrasi <HelpCircle size={12} /></span>
                    <span>-Rp65.600</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[400px] text-slate-400">
                    <span>Biaya Program Hemat Biaya Kirim</span>
                    <span>-Rp350</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[400px] text-slate-400">
                    <span className="flex items-center gap-1">Biaya Layanan <HelpCircle size={12} /></span>
                    <span>-Rp41.000</span>
                  </div>

                  <div className="flex justify-between items-center w-full max-w-[400px] pt-4 border-t border-slate-100">
                    <span className="font-bold text-slate-800 flex items-center gap-1">Total Penghasilan <HelpCircle size={14} /></span>
                    <span className="text-3xl font-bold text-[#ee4d2d]">Rp713.050</span>
                  </div>
                </div>
              </div>
            </div>
          </div>)}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className={`relative bg-white border-4 border-dashed rounded-[3rem] p-8 transition-all group flex flex-col items-center justify-center min-h-[500px] text-center ${isAnalyzing ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
                {uploadedImages.length > 0 ? (<div className="w-full space-y-6"><div className="flex justify-center">{uploadedImages.map((img) => (<div key={img.id} className="relative group/img w-full max-w-[300px] aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200"><img src={img.url} alt="Preview" className="w-full h-full object-cover" /><button onClick={() => removeImage(img.id)} className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors" title="Hapus Foto"><X size={20} strokeWidth={3} /></button></div>))}</div><button onClick={runAnalysis} disabled={isAnalyzing} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 disabled:bg-slate-300">{isAnalyzing ? (<><Loader2 className="animate-spin" size={24} /> Menganalisa...</>) : (<><Sparkles size={24} /> Mulai Analisa Pesanan</>)}</button></div>) : (<><div className="bg-emerald-100 p-8 rounded-full text-emerald-600 mb-8 group-hover:scale-110 transition-transform"><ImageIcon size={64} /></div><h3 className="text-3xl font-black text-slate-800 mb-4">Pilih Screenshot</h3><p className="text-slate-500 text-lg max-w-xs mx-auto mb-8 font-medium">Upload 1 foto detail penghasilan pesanan Shopee Anda.</p><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} /><div className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl group-hover:bg-emerald-600 transition-colors flex items-center gap-3"><Upload size={20} strokeWidth={3} /> Upload Foto</div></>)}
              </div>
              {globalSummary && globalSummary.quantity > 0 && (<div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl space-y-10 animate-in fade-in slide-in-from-top-4"><div className="flex items-center gap-4 text-emerald-600 mb-2"><CheckCircle2 size={32} /><h3 className="text-3xl font-black">Data Terekstrak</h3></div><div className="grid grid-cols-1 gap-6"><div className="bg-slate-50 p-6 rounded-3xl"><span className="text-sm font-black text-slate-400 uppercase tracking-widest block mb-2">Total Penghasilan</span><p className="text-4xl font-black text-slate-900 font-mono">{formatCurrency(globalSummary.totalEarnings)}</p></div><div className="grid grid-cols-2 gap-6"><div className="bg-slate-50 p-6 rounded-3xl"><span className="text-sm font-black text-slate-400 uppercase tracking-widest block mb-2">Sub Total</span><p className="text-3xl font-black text-slate-900 font-mono">{formatCurrency(globalSummary.subTotal)}</p></div><div className="bg-slate-50 p-6 rounded-3xl"><span className="text-sm font-black text-slate-400 uppercase tracking-widest block mb-2">Jumlah Quantity</span><p className="text-3xl font-black text-slate-900 font-mono text-center">{globalSummary.quantity} Pcs</p></div></div></div></div>)}
            </div>
            <div className="space-y-12"><div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl"><div className="flex items-center gap-4 mb-10"><div className="bg-blue-100 p-4 rounded-2xl text-blue-600"><Calculator size={32} /></div><div><h3 className="text-3xl font-black text-slate-900">Input Data Pendukung</h3><p className="text-slate-500 font-medium">Lengkapi untuk melihat kalkulasi profit</p></div></div><div className="space-y-10">
              <div className="group"><label className="block text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Harga Modal / Unit</label><div className="relative border-b-4 border-slate-100 group-focus-within:border-emerald-500 transition-all pb-4"><span className="absolute left-0 bottom-4 text-3xl font-black text-slate-200">Rp</span><input type="text" inputMode="numeric" value={formatNumber(analyzerUnitCost)} onChange={(e) => setAnalyzerUnitCost(parseNumberInput(e.target.value))} className="w-full pl-16 bg-transparent outline-none text-6xl font-black text-slate-900 placeholder-slate-100 font-mono" placeholder="0" /></div></div>
              <div className="group"><label className="block text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Biaya Growlab (%)</label><div className="relative border-b-4 border-slate-100 group-focus-within:border-emerald-500 transition-all pb-4"><input type="text" inputMode="decimal" value={analyzerGrowlabPercent} onChange={(e) => {
                let val = e.target.value.replace(',', '.').replace(/[^\d.]/g, '');
                if (val === '') { setAnalyzerGrowlabPercent('0'); return; }
                if (val.length > 1 && val.startsWith('0') && val[1] !== '.') { val = val.replace(/^0+/, ''); if (val === '') val = '0'; }
                if (val === '.') val = '0.';
                const parts = val.split('.');
                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                setAnalyzerGrowlabPercent(val);
              }} className="w-full pr-16 bg-transparent outline-none text-6xl font-black text-slate-900 placeholder-slate-100 font-mono text-right" placeholder="0" /><span className="absolute right-0 bottom-4 text-3xl font-black text-slate-200">%</span></div></div>
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-4">% Biaya Operasional</span><div className="flex items-baseline justify-between"><p className="text-5xl font-black text-white">{calculatedOpsRatio.toFixed(1)}%</p><p className="text-lg font-black text-emerald-400">Fixed Rate</p></div></div>
            </div>{analyzerMetrics && (<div className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-2 gap-6"><div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50"><div className="flex items-center gap-2 mb-2 text-slate-400"><ImageIcon size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Penghasilan / Unit</span></div><p className="text-2xl font-black text-slate-800 font-mono">{formatCurrency(analyzerMetrics.totalEarningsUnit)}</p></div><div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50"><div className="flex items-center gap-2 mb-2 text-slate-400"><Coins size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Biaya Ops / Unit</span></div><p className="text-2xl font-black text-slate-800 font-mono">{formatCurrency(analyzerMetrics.opsNominal)}</p></div><div className="p-6 rounded-3xl border border-slate-100 bg-emerald-50/30 col-span-2"><div className="flex items-center gap-2 mb-2 text-emerald-600"><Target size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Biaya Growlab / Unit</span></div><p className="text-3xl font-black text-emerald-800 font-mono">{formatCurrency(analyzerMetrics.growlabFeeAmount)}</p></div></div>
              <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative"><div className="flex justify-between items-start mb-10"><div><span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] block mb-2">Estimasi Profit Akhir</span><p className={`text-6xl font-black font-mono tracking-tighter ${analyzerMetrics.profit >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(analyzerMetrics.profit)}</p></div><div className="text-right"><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-2">% Profit</span><p className="text-3xl font-black text-white">{analyzerMetrics.profitPercent.toFixed(1)}%</p></div></div><div className="pt-8 border-t border-white/5 flex justify-between items-center"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Target size={20} /></div><div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Minimal ROAS</span><p className="text-2xl font-black text-emerald-400">{analyzerMetrics.minRoas.toFixed(1)}x</p></div></div><button onClick={handleFinishAnalyzer} className="px-8 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center gap-3 text-lg">Selesai <ChevronRight size={24} strokeWidth={4} /></button></div></div>
            </div>)}</div></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard' || currentView === 'pricing-calculator') {
    const isPricing = currentView === 'pricing-calculator';
    const activeProducts = isPricing ? pricingProducts : products;
    const activeSummary = isPricing ? pricingSummary : totalSummary;

    return (
      <div className="min-h-screen pb-32 bg-[#F0FDF4] font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-30 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView('nav-hub')} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all mr-2"><ArrowLeft size={20} /></button>
              <div>
                <h1 className="text-xl font-bold leading-none tracking-tight">Growlab<span className="text-emerald-400">Tools</span></h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{isPricing ? 'Kalkulator Harga Jual' : 'Kalkulator Margin'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block"><span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Biaya Operasional</span><span className="font-mono text-emerald-400 font-bold">{calculatedOpsRatio.toFixed(2)}%</span></div>
              <button onClick={() => setCurrentView('nav-hub')} className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-4 py-2 rounded-full font-medium transition-all border border-slate-700">Menu Utama</button>
              <button onClick={() => { setIsAuthenticated(false); setCurrentView('login'); setUsername(''); setPassword(''); }} className="text-xs bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-200 px-4 py-2 rounded-full font-medium transition-all border border-slate-700 hover:border-red-900">Logout</button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white border border-emerald-100 rounded-2xl p-6 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-4 z-10">
              <div className={`p-3 rounded-full ${isPricing ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {isPricing ? <Target size={24} /> : <Calculator size={24} />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg mb-1">{isPricing ? 'Kalkulasi Harga Jual Ideal' : 'Kalkulasi Margin Produk'}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                  {isPricing 
                    ? 'Tentukan target keuntungan Anda, kami carikan harga jual idealnya.' 
                    : 'Hitung margin Anda secara manual.'}
                  Setiap produk otomatis dibebani biaya operasional <span className="text-emerald-600 font-bold">{calculatedOpsRatio.toFixed(2)}%</span>.
                </p>
              </div>
            </div>
            <button onClick={() => setCurrentView('nav-hub')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all z-10 flex items-center gap-2"><LayoutGrid size={16} /> Pilih Menu Lain</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {activeProducts.map((product, index) => (
              isPricing ? (
                <PricingCard key={product.id} product={product} index={index} onUpdate={(id, f, v) => updateProduct(id, f, v, 'pricing')} onDelete={(id) => removeProduct(id, 'pricing')} onDuplicate={(p) => duplicateProduct(p, 'pricing')} />
              ) : (
                <ProductCard key={product.id} product={product} index={index} onUpdate={(id, f, v) => updateProduct(id, f, v, 'margin')} onDelete={(id) => removeProduct(id, 'margin')} onDuplicate={(p) => duplicateProduct(p, 'margin')} />
              )
            ))}
            {activeProducts.length < 4 && (<button onClick={() => addProduct(isPricing ? 'pricing' : 'margin')} className="group flex flex-col items-center justify-center min-h-[420px] bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-300 cursor-pointer"><div className="bg-white p-5 rounded-full shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all group-hover:text-emerald-500 text-slate-400"><Plus size={32} /></div><span className="font-bold text-slate-500 group-hover:text-emerald-700">Tambah {isPricing ? 'Simulasi Pricing' : 'Produk Baru'}</span></button>)}
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 shadow-2xl z-40 text-white">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-8">
                <div><span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Estimasi Omzet</span><span className="text-xl font-mono font-medium text-white">{formatCurrency(activeSummary.revenue)}</span></div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div><span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block mb-1">Total Target Profit</span><span className={`text-3xl font-mono font-bold ${activeSummary.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(activeSummary.profit)}</span></div>
              </div>
              <button onClick={() => setCurrentView('nav-hub')} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all shadow-lg flex items-center gap-2">Selesai & Menu Utama <ArrowRight size={20} /></button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}

function getNumber(val: string): number {
  const normalized = val.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export default App;
