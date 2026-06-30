import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiX, FiDollarSign, FiUser, FiBox, FiCalendar, FiFileText,
  FiPercent, FiPlus, FiTrash2, FiCheck, FiSearch
} from 'react-icons/fi';

const TAX_RATE = 0.15;
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const calcItemRow = (item) => {
  const sub_total = round2(item.weight_grams * item.price_per_gram);
  const discount = round2(item.discount || 0);
  const afterDiscount = round2(sub_total - discount);
  const tax_amount = item.is_taxed ? round2(afterDiscount * TAX_RATE) : 0;
  const final_total = round2(afterDiscount + tax_amount);
  return { ...item, sub_total, discount, tax_amount, final_total };
};

const SalesModal = ({ sale, onClose, onRefresh }) => {
  const [employees, setEmployees] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const [employeeId, setEmployeeId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);
  const [itemWeight, setItemWeight] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemTaxed, setItemTaxed] = useState(true);
  const [itemName, setItemName] = useState('');
  const [itemKarat, setItemKarat] = useState('');
  const [invSearch, setInvSearch] = useState('');

  useEffect(() => {
    fetchData();
    if (sale) {
      setEmployeeId(sale.employee_id || '');
      setSaleDate(sale.sale_date ? sale.sale_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNotes(sale.notes || '');
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
      const [empRes, invRes, priceRes] = await Promise.all([
        api.getEmployees(),
        api.getInventory(),
        api.getCurrentPrice(),
      ]);
      setEmployees(empRes.data.filter(e => e.is_active));
      setInventory(invRes.data.filter(i => !i.is_sold));
      if (priceRes.data) setCurrentPrice(parseFloat(priceRes.data.amount));
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const filteredInventory = inventory.filter(i =>
    i.category_name?.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.karat_name?.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.jewelry_type?.toLowerCase().includes(invSearch.toLowerCase())
  );

  const handleSelectInventory = (inv) => {
    setSelectedInv(inv);
    setItemName(`${inv.category_name || 'Item'} - ${inv.karat_name || ''}`);
    setItemKarat(inv.karat_name || '');
    setItemPrice(inv.current_price || currentPrice);
    setItemWeight('');
    setItemDiscount(0);
    setItemTaxed(true);
  };

  const handleAddItem = () => {
    if (!itemWeight || parseFloat(itemWeight) <= 0) {
      toast.error('Enter a valid weight');
      return;
    }
    if (!itemPrice || parseFloat(itemPrice) <= 0) {
      toast.error('Enter a valid price per gram');
      return;
    }
    const newItem = calcItemRow({
      id: Date.now(),
      inventory_id: selectedInv?.id || null,
      item_name: itemName || 'Custom Item',
      karat: itemKarat,
      weight_grams: round2(parseFloat(itemWeight)),
      price_per_gram: round2(parseFloat(itemPrice)),
      discount: round2(parseFloat(itemDiscount) || 0),
      is_taxed: itemTaxed,
    });
    setItems(prev => [...prev, newItem]);
    toast.success('Item added');
    setSelectedInv(null);
    setItemWeight('');
    setItemPrice('');
    setItemDiscount(0);
    setItemTaxed(true);
    setItemName('');
    setItemKarat('');
    setInvSearch('');
    setShowItemForm(false);
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
      return calcItemRow({ ...item, discount: round2(parseFloat(val) || 0) });
    }));
  };

  const subTotal = round2(items.reduce((s, i) => s + i.sub_total, 0));
  const totalDiscount = round2(items.reduce((s, i) => s + i.discount, 0));
  const totalTax = round2(items.reduce((s, i) => s + i.tax_amount, 0));
  const grandTotal = round2(items.reduce((s, i) => s + i.final_total, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        employee_id: employeeId,
        sale_date: saleDate,
        notes,
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content !p-4 sm:!p-8 max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg font-bold text-white">
            {sale ? 'Edit Sale' : 'Add New Sale'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-primary rounded-lg text-gray-400"><FiX /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Employee *</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                  className="input-field pl-10" required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sale Date *</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
                  className="input-field pl-10" required />
              </div>
            </div>
          </div>

          {/* ITEMS SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Items * ({items.length})</label>
              <button type="button" onClick={() => setShowItemForm(!showItemForm)}
                className="text-gold text-sm flex items-center gap-1 hover:text-gold-light">
                <FiPlus size={14} /> Add Item
              </button>
            </div>

            {showItemForm && (
              <div className="bg-primary rounded-lg p-3 sm:p-4 mb-3 space-y-3 border border-secondary">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search inventory..."
                    value={invSearch} onChange={(e) => setInvSearch(e.target.value)}
                    className="input-field pl-10 text-sm" />
                </div>

                {invSearch && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredInventory.map(inv => (
                      <button key={inv.id} type="button" onClick={() => handleSelectInventory(inv)}
                        className={`w-full text-left p-2 rounded text-sm transition ${
                          selectedInv?.id === inv.id ? 'bg-gold/20 border border-gold' : 'hover:bg-secondary border border-transparent'
                        }`}>
                        <div className="flex justify-between">
                          <span className="text-white">{inv.category_name} - {inv.karat_name}</span>
                          <span className="text-gold">${inv.current_price}/g</span>
                        </div>
                        <span className="text-gray-500 text-xs">{inv.jewelry_type} • {inv.weight_grams}g stock</span>
                      </button>
                    ))}
                    {filteredInventory.length === 0 && (
                      <p className="text-gray-500 text-xs text-center py-2">No items found</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Item Name</label>
                    <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)}
                      className="input-field text-sm" placeholder="Item name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Karat</label>
                    <input type="text" value={itemKarat} onChange={(e) => setItemKarat(e.target.value)}
                      className="input-field text-sm" placeholder="e.g. 24K" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Weight (g) *</label>
                    <input type="number" step="0.001" min="0" value={itemWeight}
                      onChange={(e) => setItemWeight(e.target.value)}
                      className="input-field text-sm" placeholder="0.000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Price/g *</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input type="number" step="0.01" min="0" value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="input-field pl-8 text-sm" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Discount</label>
                    <div className="relative">
                      <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input type="number" step="0.01" min="0" value={itemDiscount}
                        onChange={(e) => setItemDiscount(e.target.value)}
                        className="input-field pl-8 text-sm" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                      <input type="checkbox" checked={itemTaxed}
                        onChange={(e) => setItemTaxed(e.target.checked)}
                        className="w-4 h-4 text-gold rounded" />
                      <span className="text-sm text-gray-300">Tax (15%)</span>
                    </label>
                  </div>
                </div>

                {itemWeight && itemPrice && (
                  <div className="bg-secondary/50 rounded p-2 text-xs space-y-1">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal:</span>
                      <span className="text-white">{formatCurrency(round2(parseFloat(itemWeight) * parseFloat(itemPrice)))}</span>
                    </div>
                    {itemDiscount > 0 && (
                      <div className="flex justify-between text-gray-400">
                        <span>Discount:</span>
                        <span className="text-red-400">-{formatCurrency(parseFloat(itemDiscount))}</span>
                      </div>
                    )}
                    {itemTaxed && (
                      <div className="flex justify-between text-gray-400">
                        <span>Tax (15%):</span>
                        <span className="text-gold">{formatCurrency(round2((parseFloat(itemWeight) * parseFloat(itemPrice) - parseFloat(itemDiscount || 0)) * TAX_RATE))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-300 font-semibold pt-1 border-t border-secondary">
                      <span>Total:</span>
                      <span className="text-gold">{formatCurrency(round2(
                        (parseFloat(itemWeight) * parseFloat(itemPrice) - parseFloat(itemDiscount || 0)) * (itemTaxed ? 1 + TAX_RATE : 1)
                      ))}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowItemForm(false)}
                    className="btn-secondary text-sm py-1.5 px-4">Cancel</button>
                  <button type="button" onClick={handleAddItem}
                    className="btn-primary text-sm py-1.5 px-4" disabled={!itemWeight || !itemPrice}>
                    Add to Sale
                  </button>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-secondary rounded-lg">
                No items added yet. Click "Add Item" to start.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary text-gray-400 text-xs">
                        <th className="text-left py-2 px-2">Item</th>
                        <th className="text-left py-2 px-2">Wt (g)</th>
                        <th className="text-left py-2 px-2">$/g</th>
                        <th className="text-left py-2 px-2">Sub</th>
                        <th className="text-left py-2 px-2">Disc</th>
                        <th className="text-center py-2 px-2">Tax</th>
                        <th className="text-right py-2 px-2">Total</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-secondary/50 hover:bg-secondary/30">
                          <td className="py-2 px-2 text-white text-xs">{item.item_name}</td>
                          <td className="py-2 px-2 text-gray-300 text-xs">{item.weight_grams}</td>
                          <td className="py-2 px-2 text-gray-300 text-xs">{formatCurrency(item.price_per_gram)}</td>
                          <td className="py-2 px-2 text-gray-300 text-xs">{formatCurrency(item.sub_total)}</td>
                          <td className="py-2 px-2">
                            <input type="number" min="0" step="0.01" value={item.discount}
                              onChange={(e) => handleUpdateItemDiscount(item.id, e.target.value)}
                              className="input-field w-16 py-1 px-1.5 text-xs" />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button type="button" onClick={() => handleToggleItemTax(item.id)}
                              className={`p-1 rounded text-xs ${item.is_taxed ? 'bg-gold/20 text-gold' : 'bg-gray-700 text-gray-400'}`}>
                              {item.is_taxed ? <FiCheck size={12} /> : <FiX size={12} />}
                            </button>
                          </td>
                          <td className="py-2 px-2 text-right text-gold font-semibold text-xs">{formatCurrency(item.final_total)}</td>
                          <td className="py-2 px-2">
                            <button type="button" onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                              <FiTrash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sm:hidden space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="bg-primary rounded-lg p-3 border border-secondary">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-white text-xs font-medium">{item.item_name}</p>
                          <p className="text-gray-500 text-xs">{item.weight_grams}g × {formatCurrency(item.price_per_gram)}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Disc:</span>
                          <input type="number" min="0" step="0.01" value={item.discount}
                            onChange={(e) => handleUpdateItemDiscount(item.id, e.target.value)}
                            className="input-field w-14 py-0.5 px-1 text-xs" />
                        </div>
                        <button type="button" onClick={() => handleToggleItemTax(item.id)}
                          className={`px-2 py-0.5 rounded text-xs ${item.is_taxed ? 'bg-gold/20 text-gold' : 'bg-gray-700 text-gray-400'}`}>
                          {item.is_taxed ? 'Taxed' : 'No Tax'}
                        </button>
                        <span className="text-gold font-semibold">{formatCurrency(item.final_total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="bg-primary rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">{formatCurrency(subTotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Total Discount</span>
                  <span className="text-red-400">-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>Tax (15%)</span>
                <span className="text-gold">{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-secondary">
                <span>Grand Total</span>
                <span className="text-gold">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <div className="relative">
              <FiFileText className="absolute left-3 top-3 text-gray-400" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="input-field pl-10" rows="2" placeholder="Optional notes..." />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t border-secondary">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || items.length === 0} className="btn-primary">
              {loading ? 'Saving...' : sale ? 'Update Sale' : 'Add Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesModal;
