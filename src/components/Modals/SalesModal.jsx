import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiX, FiDollarSign, FiUser, FiCalendar, FiFileText,
  FiPlus, FiTrash2, FiCheck, FiShoppingCart
} from 'react-icons/fi';
import InventorySelectionModal from './InventorySelectionModal';

const TAX_RATE = 0.15;
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const calcItemRow = (item) => {
  const w = parseFloat(item.weight_grams) || 0;
  const p = parseFloat(item.price_per_gram) || 0;
  const sub_total = round2(w * p);
  const d = parseFloat(item.discount) || 0;
  const discountAmount = round2(d);
  const afterDiscount = round2(sub_total - discountAmount);
  const tax_amount = item.is_taxed ? round2(afterDiscount * TAX_RATE) : 0;
  const final_total = round2(afterDiscount + tax_amount);
  return { ...item, sub_total, tax_amount, final_total };
};

const SalesModal = ({ sale, onClose, onRefresh }) => {
  const [employees, setEmployees] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [karats, setKarats] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [employeeId, setEmployeeId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  // Payment State
  const [paidAmount, setPaidAmount] = useState('');

  // Inventory Selection Modal
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  useEffect(() => {
    fetchData();
    if (sale) {
      setEmployeeId(sale.employee_id || '');
      setSaleDate(sale.sale_date ? sale.sale_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNotes(sale.notes || '');
      setPaidAmount(sale.paid_amount || '');
      if (sale.items && sale.items.length > 0) {
        setItems(sale.items.map(i => calcItemRow({
          id: i.id || Date.now() + Math.random(),
          inventory_id: i.inventory_id,
          item_name: i.item_name || `${i.category_name || 'Item'} - ${i.karat_name || ''}`,
          karat: i.karat || '',
          weight_grams: parseFloat(i.weight_grams) || 0,
          price_per_gram: parseFloat(i.price_per_gram) || parseFloat(i.current_price) || 0,
          discount: parseFloat(i.discount) || 0,
          is_taxed: i.is_taxed !== undefined ? i.is_taxed : true,
        })));
      }
    }
  }, [sale]);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [empRes, invRes, priceRes, catRes, karatRes] = await Promise.all([
        api.getEmployees(),
        api.getInventory(),
        api.getCurrentPrice(),
        api.getCategories(),
        api.getKarats()
      ]);
      setEmployees(empRes.data.filter(e => e.is_active));
      setInventory(invRes.data.filter(i => !i.is_sold));
      if (priceRes.data) setCurrentPrice(parseFloat(priceRes.data.amount));
      setCategories(catRes.data);
      setKarats(karatRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load required data.');
    } finally {
      setFetching(false);
    }
  };

  const handleAddItem = (selectedItemData) => {
    const weight = round2(parseFloat(selectedItemData.saleWeight));
    if (!selectedItemData || !weight || weight <= 0) {
      toast.error('Invalid weight');
      return;
    }

    const pricePerGram = parseFloat(selectedItemData.current_price) || currentPrice;

    const type = selectedItemData.jewelry_type || 'Jewelry';
    const main = selectedItemData.main_category_name || '';
    const sub = selectedItemData.sub_category_name || '';
    const parts = [type, main, sub].filter(Boolean);
    const generatedItemName = parts.length > 0 ? parts.join(' - ') : 'Item';

    const newItem = calcItemRow({
      id: Date.now(),
      inventory_id: selectedItemData.id,
      item_name: generatedItemName,
      karat: selectedItemData.karat_name || '',
      weight_grams: weight,
      price_per_gram: pricePerGram,
      discount: round2(parseFloat(selectedItemData.saleDiscount) || 0),
      is_taxed: true, // Defaulting to true
    });

    setItems(prev => [...prev, newItem]);
    toast.success('Item added');
    setShowInventoryModal(false);
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleToggleItemTax = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return calcItemRow({ ...item, is_taxed: !item.is_taxed });
    }));
  };

  const handleUpdateItemDiscount = (id, val) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return calcItemRow({ ...item, discount: val });
    }));
  };

  const handleUpdateItemWeight = (id, val) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return calcItemRow({ ...item, weight_grams: val });
    }));
  };

  const handleUpdateItemPrice = (id, val) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return calcItemRow({ ...item, price_per_gram: val });
    }));
  };

  const subTotal = round2(items.reduce((s, i) => s + i.sub_total, 0));
  const totalDiscount = round2(items.reduce((s, i) => s + i.discount, 0));
  const totalTax = round2(items.reduce((s, i) => s + i.tax_amount, 0));
  const grandTotal = round2(items.reduce((s, i) => s + i.final_total, 0));

  const remainingBalance = round2(grandTotal - (parseFloat(paidAmount) || 0));
  
  let paymentStatus = 'Unpaid';
  if ((parseFloat(paidAmount) || 0) >= grandTotal && grandTotal > 0) paymentStatus = 'Full';
  else if ((parseFloat(paidAmount) || 0) > 0) paymentStatus = 'Partial';

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    if (!employeeId) {
      toast.error('Select an employee');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        employee_id: employeeId,
        sale_date: saleDate,
        notes,
        // Passing optional payment info if backend starts supporting it
        paid_amount: parseFloat(paidAmount) || 0,
        payment_status: paymentStatus, 
        items: items.map(i => ({
          inventory_id: i.inventory_id,
          item_name: i.item_name,
          karat: i.karat,
          weight_grams: i.weight_grams,
          price_per_gram: i.price_per_gram,
          discount: i.discount,
          is_taxed: i.is_taxed,
        })),
      };
      if (sale) {
        await api.updateSale(sale.id, payload);
        toast.success('Sale updated');
      } else {
        await api.addSale(payload);
        toast.success('Sale added');
      }
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  if (fetching) {
    return (
      <div className="modal-overlay">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return createPortal(
    <>
      <div className="modal-overlay z-[60] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
        <div className="modal-content !p-0 w-full max-w-6xl h-[90vh] bg-[#141414] border border-[#333] shadow-2xl flex flex-col rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-[#333] bg-[#1A1A1A]">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FiShoppingCart className="text-gold" /> {sale ? 'Edit Sale' : 'Daily Sales'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-lg text-gray-400 transition">
              <FiX size={24} />
            </button>
          </div>

          {/* Main Body - Two Columns */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            
            {/* Left Column - Items & Details */}
            <div className="flex-1 overflow-y-auto p-6 border-r border-[#333] custom-scrollbar">
              
              {/* Date & Employee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Employee *</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg focus:border-gold focus:outline-none transition appearance-none" required>
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Sale Date *</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg focus:border-gold focus:outline-none transition" required />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gold">Add Items from Inventory</h3>
                <button type="button" onClick={() => setShowInventoryModal(true)}
                  className="bg-gold/10 text-gold hover:bg-gold/20 border border-gold/30 px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm font-medium">
                  <FiPlus size={16} /> Browse Inventory
                </button>
              </div>

              {/* Cart Table */}
              <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden min-h-[300px]">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-gray-500">
                    <FiShoppingCart size={48} className="mb-4 opacity-20" />
                    <p>No items added yet.</p>
                    <p className="text-sm">Click 'Browse Inventory' to start.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#333] bg-[#1A1A1A]">
                        <th className="py-3 px-4 font-semibold text-gray-400 text-sm"># Item Details</th>
                        <th className="py-3 px-4 font-semibold text-gray-400 text-sm">Wt (g)</th>
                        <th className="py-3 px-4 font-semibold text-gray-400 text-sm">$/g</th>
                        <th className="py-3 px-4 font-semibold text-gray-400 text-sm w-24">Disc</th>
                        <th className="py-3 px-4 font-semibold text-gray-400 text-sm text-center">Tax</th>
                        <th className="py-3 px-4 font-semibold text-gray-400 text-sm text-right">Total</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id} className="border-b border-[#333] hover:bg-[#1A1A1A] transition">
                          <td className="py-3 px-4">
                            <p className="text-white font-medium text-sm">{item.item_name}</p>
                            <p className="text-xs text-gray-500">ID: {item.inventory_id || 'Custom'} • {item.karat}</p>
                          </td>
                          <td className="py-3 px-4">
                            <input type="number" min="0" step="0.01" value={item.weight_grams}
                              onChange={(e) => handleUpdateItemWeight(item.id, e.target.value)}
                              className="w-16 bg-[#222] border border-[#444] rounded px-2 py-1 text-sm text-white focus:border-gold outline-none" />
                          </td>
                          <td className="py-3 px-4">
                            <input type="number" min="0" step="0.01" value={item.price_per_gram}
                              onChange={(e) => handleUpdateItemPrice(item.id, e.target.value)}
                              className="w-24 bg-[#222] border border-[#444] rounded px-2 py-1 text-sm text-white focus:border-gold outline-none" />
                          </td>
                          <td className="py-3 px-4">
                            <input type="number" min="0" step="0.01" value={item.discount}
                              onChange={(e) => handleUpdateItemDiscount(item.id, e.target.value)}
                              className="w-full bg-[#222] border border-[#444] rounded px-2 py-1 text-sm text-white focus:border-gold outline-none" />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button type="button" onClick={() => handleToggleItemTax(item.id)}
                              className={`p-1.5 rounded text-xs transition ${item.is_taxed ? 'bg-gold/20 text-gold' : 'bg-[#333] text-gray-400'}`}>
                              {item.is_taxed ? <FiCheck size={14} /> : <FiX size={14} />}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right text-gold font-semibold text-sm">
                            {formatCurrency(item.final_total)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button type="button" onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition">
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                <div className="relative">
                  <FiFileText className="absolute left-3 top-3 text-gray-500" />
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-2 rounded-lg focus:border-gold focus:outline-none transition" 
                    rows="3" placeholder="Optional notes..." />
                </div>
              </div>

            </div>

            {/* Right Column - Summary & Payment */}
            <div className="w-full lg:w-[400px] flex flex-col bg-[#1A1A1A] overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6 flex-1">
                
                {/* Sale Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gold mb-4">Sale Summary</h3>
                  <div className="bg-[#111] border border-[#333] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Sub Total</span>
                      <span className="text-white font-medium">{formatCurrency(subTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Taxable Amount (15%)</span>
                      <span className="text-white font-medium">{formatCurrency(subTotal - totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tax Amount (15%)</span>
                      <span className="text-gold font-medium">{formatCurrency(totalTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Discount</span>
                      <span className="text-red-400 font-medium">-{formatCurrency(totalDiscount)}</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#333] flex justify-between items-center">
                      <span className="text-lg font-bold text-white">Grand Total</span>
                      <span className="text-2xl font-bold text-gold">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h3 className="text-lg font-semibold text-gold mb-4">Payment</h3>
                  <div className="bg-[#111] border border-[#333] rounded-xl p-4 space-y-4">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Paid Amount (USD)</label>
                      <div className="relative">
                        <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type="number" step="0.01" min="0" value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-[#333] text-white pl-10 pr-4 py-2 rounded-lg focus:border-gold focus:outline-none transition" 
                          placeholder="0.00" />
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remaining Balance</span>
                      <span className={`font-bold ${remainingBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(remainingBalance)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-[#333]">
                      <span className="text-gray-400">Payment Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        paymentStatus === 'Full' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        paymentStatus === 'Partial' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-6 bg-[#111] border-t border-[#333]">
                <button 
                  onClick={handleSubmit} 
                  disabled={loading || items.length === 0} 
                  className="w-full bg-gold hover:bg-yellow-500 text-[#111] font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <FiShoppingCart size={18} />
                  {loading ? 'Saving...' : sale ? 'Update Sale' : 'Save Sale'}
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>

      {showInventoryModal && (
        <InventorySelectionModal
          inventory={inventory}
          categories={categories}
          karats={karats}
          currentPrice={currentPrice}
          onClose={() => setShowInventoryModal(false)}
          onSelect={handleAddItem}
        />
      )}
    </>,
    document.body
  );
};

export default SalesModal;
