import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiMinus, FiShoppingCart, FiDollarSign,
  FiCheck, FiX, FiSearch, FiPackage, FiUser, FiPercent
} from 'react-icons/fi';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const POS = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    cartItems, paidAmount, summary, remainingBalance, paymentStatus,
    addItem, removeItem, toggleTax, updateDiscount, setPaidAmount, clearCart,
  } = useCart();

  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [karats, setKarats] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Add item form
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [itemWeight, setItemWeight] = useState('');
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemIsTaxed, setItemIsTaxed] = useState(true);

  // Pay form
  const [payAmount, setPayAmount] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, empRes, catRes, karatRes, priceRes] = await Promise.all([
        api.getInventory(),
        api.getEmployees(),
        api.getCategories(),
        api.getKarats(),
        api.getCurrentPrice(),
      ]);
      setInventory(invRes.data.filter(i => !i.is_sold));
      setEmployees(empRes.data.filter(e => e.is_active));
      setCategories(catRes.data);
      setKarats(karatRes.data);
      if (priceRes.data) setCurrentPrice(priceRes.data.amount);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        toast.error('Session expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.karat_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jewelry_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = () => {
    if (!selectedInventory || !itemWeight || parseFloat(itemWeight) <= 0) {
      toast.error('Select an item and enter a valid weight');
      return;
    }
    const inv = selectedInventory;
    const weight = round2(parseFloat(itemWeight));
    const pricePerGram = parseFloat(inv.current_price) || currentPrice;

    addItem({
      id: Date.now(),
      inventory_id: inv.id,
      name: `${inv.category_name || 'Item'} - ${inv.karat_name || ''}`,
      sku: inv.id?.toString() || '',
      karat: inv.karat_name || '',
      weight: weight,
      basePricePerGram: parseFloat(inv.base_price) || pricePerGram,
      currentPricePerGram: pricePerGram,
      isTaxed: itemIsTaxed,
      discount: round2(parseFloat(itemDiscount) || 0),
    });

    toast.success('Item added to cart');
    setSelectedInventory(null);
    setItemWeight('');
    setItemDiscount(0);
    setItemIsTaxed(true);
    setShowAddModal(false);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!selectedEmployee) {
      toast.error('Select an employee');
      return;
    }
    if (parseFloat(payAmount) < summary.grandTotal) {
      toast.error('Paid amount is less than grand total');
      return;
    }

    try {
      await api.addSale({
        employee_id: selectedEmployee,
        sale_date: new Date().toISOString().split('T')[0],
        notes: null,
        items: cartItems.map((item) => ({
          inventory_id: item.inventory_id,
          item_name: item.name,
          karat: item.karat,
          weight_grams: item.weight,
          price_per_gram: item.currentPricePerGram,
          discount: item.discount || 0,
          is_taxed: item.isTaxed,
        })),
      });
      toast.success('Sale completed successfully!');
      clearCart();
      setShowPayModal(false);
      setPayAmount('');
      setSelectedEmployee('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Sale failed');
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiShoppingCart className="text-gold" /> Point of Sale
          </h2>
          <p className="text-gray-400 mt-1">Create a new sale transaction</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <FiPlus /><span>Add Item</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Cart Items ---- */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.length === 0 ? (
            <div className="card text-center py-16">
              <FiShoppingCart className="mx-auto text-gray-600 mb-4" size={48} />
              <p className="text-gray-400 text-lg">Cart is empty</p>
              <p className="text-gray-500 text-sm mt-1">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {cartItems.map((item) => (
                  <CartItemCard key={item.id} item={item} onRemove={removeItem} onToggleTax={toggleTax} onUpdateDiscount={updateDiscount} formatCurrency={formatCurrency} />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block card overflow-x-auto p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary">
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-sm">Item</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-sm">Weight</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-sm">Price/g</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-sm">Subtotal</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-sm">Discount</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-400 text-sm">Tax</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-400 text-sm">Total</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.id} className="border-b border-secondary hover:bg-secondary/50 transition">
                        <td className="py-3 px-4">
                          <p className="font-medium text-white text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.karat}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{item.weight}g</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{formatCurrency(item.currentPricePerGram)}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{formatCurrency(item.subTotal)}</td>
                        <td className="py-3 px-4">
                          <input type="number" min="0" step="0.01" value={item.discount || 0}
                            onChange={(e) => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                            className="input-field w-20 py-1 px-2 text-sm" />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => toggleTax(item.id)}
                            className={`p-1.5 rounded-lg transition text-sm ${item.isTaxed ? 'bg-gold/20 text-gold' : 'bg-gray-700 text-gray-400'}`}>
                            {item.isTaxed ? <FiCheck size={14} /> : <FiX size={14} />}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gold text-sm">{formatCurrency(item.finalTotal)}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => removeItem(item.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition">
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ---- Summary Panel ---- */}
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-medium">{formatCurrency(summary.globalSubTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Discount</span>
                <span className="text-red-400 font-medium">-{formatCurrency(summary.totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Taxable Amount</span>
                <span className="text-gray-300 font-medium">{formatCurrency(summary.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax (15%)</span>
                <span className="text-gold font-medium">{formatCurrency(summary.taxAmount)}</span>
              </div>
              <div className="border-t border-secondary pt-3 flex justify-between">
                <span className="text-white font-bold text-lg">Grand Total</span>
                <span className="text-gold font-bold text-xl">{formatCurrency(summary.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FiDollarSign className="text-gold" /> Payment
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Paid</span>
                <span className="text-white font-medium">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Remaining</span>
                <span className={`font-medium ${remainingBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  paymentStatus === 'Full' ? 'bg-green-500/20 text-green-400' :
                  paymentStatus === 'Partial' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={() => { setPayAmount(summary.grandTotal.toString()); setShowPayModal(true); }}
              disabled={cartItems.length === 0}
              className="btn-primary w-full py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <FiDollarSign /><span>Pay Now</span>
            </button>
            <button onClick={clearCart}
              disabled={cartItems.length === 0}
              className="btn-danger w-full py-2 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <FiX /><span>Clear Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============ ADD ITEM MODAL ============ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg font-bold text-white">Add Item to Cart</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-primary rounded-lg text-gray-400"><FiX /></button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search inventory..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10" />
            </div>

            {/* Inventory List */}
            <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
              {filteredInventory.map((inv) => (
                <button key={inv.id} onClick={() => setSelectedInventory(inv)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedInventory?.id === inv.id
                      ? 'border-gold bg-gold/10'
                      : 'border-secondary hover:border-gray-600 bg-primary'
                  }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-medium">{inv.category_name || 'Item'} - {inv.karat_name}</p>
                      <p className="text-gray-500 text-xs">{inv.jewelry_type} • {inv.weight_grams}g in stock</p>
                    </div>
                    <span className="text-gold text-sm font-semibold">{formatCurrency(inv.current_price)}/g</span>
                  </div>
                </button>
              ))}
              {filteredInventory.length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">No items found</p>
              )}
            </div>

            {/* Weight & Discount */}
            {selectedInventory && (
              <div className="space-y-3 border-t border-secondary pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Weight (grams) *</label>
                  <input type="number" step="0.001" min="0" value={itemWeight}
                    onChange={(e) => setItemWeight(e.target.value)}
                    className="input-field" placeholder="e.g. 5.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Discount</label>
                  <input type="number" step="0.01" min="0" value={itemDiscount}
                    onChange={(e) => setItemDiscount(e.target.value)}
                    className="input-field" placeholder="0.00" />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={itemIsTaxed}
                    onChange={(e) => setItemIsTaxed(e.target.checked)}
                    className="w-4 h-4 text-gold rounded" />
                  <span className="text-sm text-gray-300">Apply 15% Tax</span>
                </label>

                {itemWeight && parseFloat(itemWeight) > 0 && (
                  <div className="bg-primary rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Subtotal:</span>
                      <span className="text-white">{formatCurrency(round2(parseFloat(itemWeight) * (parseFloat(selectedInventory.current_price) || currentPrice)))}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAddToCart} className="btn-primary" disabled={!selectedInventory || !itemWeight}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ PAYMENT MODAL ============ */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg font-bold text-white">Complete Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-primary rounded-lg text-gray-400"><FiX /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-primary rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Grand Total</span>
                  <span className="text-gold font-bold text-lg">{formatCurrency(summary.grandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Employee *</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="input-field pl-10" required>
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Paid Amount *</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" step="0.01" min="0" value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="input-field pl-10" placeholder="0.00" />
                </div>
              </div>

              {payAmount && parseFloat(payAmount) >= summary.grandTotal && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Change</span>
                    <span className="text-green-400 font-semibold">{formatCurrency(round2(parseFloat(payAmount) - summary.grandTotal))}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button onClick={() => setShowPayModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleCheckout} className="btn-primary">
                  <FiCheck className="mr-1" /> Complete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Cart Item Card (Mobile) ----
const CartItemCard = ({ item, onRemove, onToggleTax, onUpdateDiscount, formatCurrency }) => (
  <div className="card p-4">
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="font-medium text-white text-sm">{item.name}</p>
        <p className="text-xs text-gray-500">{item.karat} • {item.weight}g</p>
      </div>
      <button onClick={() => onRemove(item.id)}
        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition">
        <FiTrash2 size={14} />
      </button>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
      <div>
        <span className="text-gray-500">Price/g</span>
        <p className="text-gray-300">{formatCurrency(item.currentPricePerGram)}</p>
      </div>
      <div>
        <span className="text-gray-500">Subtotal</span>
        <p className="text-gray-300">{formatCurrency(item.subTotal)}</p>
      </div>
      <div>
        <span className="text-gray-500">Total</span>
        <p className="text-gold font-semibold">{formatCurrency(item.finalTotal)}</p>
      </div>
    </div>
    <div className="flex items-center justify-between pt-2 border-t border-secondary">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Discount:</span>
        <input type="number" min="0" step="0.01" value={item.discount || 0}
          onChange={(e) => onUpdateDiscount(item.id, parseFloat(e.target.value) || 0)}
          className="input-field w-16 py-1 px-2 text-xs" />
      </div>
      <button onClick={() => onToggleTax(item.id)}
        className={`px-2 py-1 rounded text-xs font-medium transition ${
          item.isTaxed ? 'bg-gold/20 text-gold' : 'bg-gray-700 text-gray-400'
        }`}>
        {item.isTaxed ? 'Taxed' : 'No Tax'}
      </button>
    </div>
  </div>
);

export default POS;
