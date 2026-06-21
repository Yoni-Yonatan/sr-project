import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDollarSign } from 'react-icons/fi';
import SalesModal from '../components/Modals/SalesModal';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.getSales();
      setSales(response.data);
    } catch (error) {
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSale(null);
    setShowModal(true);
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
    try {
      await api.deleteSale(id);
      toast.success('Sale deleted');
      fetchSales();
    } catch (error) {
      toast.error('Failed to delete sale');
    }
  };

  const filteredSales = sales.filter(sale => {
    const term = searchTerm.toLowerCase();
    if (sale.employee_name?.toLowerCase().includes(term)) return true;
    if (sale.notes?.toLowerCase().includes(term)) return true;
    if (sale.items?.some(i =>
      i.item_name?.toLowerCase().includes(term) ||
      i.karat?.toLowerCase().includes(term) ||
      i.category_name?.toLowerCase().includes(term)
    )) return true;
    return false;
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.sale_amount || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Sales</h2>
          <p className="text-gray-400 mt-1">Manage sales transactions</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0">
          <FiPlus />
          <span>Add Sale</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="card bg-gradient-to-br from-primary to-secondary text-white mb-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-gray-400 text-sm">Total Sales</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gold mt-1">
              ${totalSales.toFixed(2)}
            </h3>
            <p className="text-gray-500 text-sm mt-1">{filteredSales.length} transaction{filteredSales.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
            <FiDollarSign className="text-gold" size={24} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee, category, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading sales...</p>
        </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {sale.employee_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{sale.employee_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-400">
                          {sale.total_items || 1} item{(sale.total_items || 1) !== 1 ? 's' : ''}
                          {sale.discount > 0 && <span className="text-red-400 ml-1">• Disc: ${parseFloat(sale.discount).toFixed(2)}</span>}
                        </p>
                      </div>
                    </div>
                    <span className="text-gold font-semibold">${parseFloat(sale.sale_amount).toFixed(2)}</span>
                  </div>
                  {/* Items list */}
                  {sale.items && sale.items.length > 0 && (
                    <div className="text-xs text-gray-400 mb-2 space-y-0.5">
                      {sale.items.map((item, idx) => (
                        <p key={idx} className="truncate">{item.item_name} — {item.weight_grams}g</p>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                    <span>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '—'}</span>
                  </div>
                  {sale.notes && (
                    <p className="text-gray-400 text-sm mb-2 truncate">{sale.notes}</p>
                  )}
                  <div className="flex justify-end space-x-2 pt-3 border-t border-secondary">
                    <button onClick={() => handleEdit(sale)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                      title="Edit">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => handleDelete(sale.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                      title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
              {filteredSales.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No sales found
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary">
                    <th className="text-left py-3 px-4 font-semibold text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-400">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-400">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-400">Discount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-400">Notes</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-secondary hover:bg-secondary/50 transition">
                      <td className="py-3 px-4 text-gray-300">
                        {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {sale.employee_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-white">{sale.employee_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-300 text-sm">
                          {sale.items && sale.items.length > 0 ? (
                            <div className="space-y-0.5">
                              {sale.items.map((item, idx) => (
                                <p key={idx} className="truncate max-w-[200px]">
                                  {item.item_name} — {item.weight_grams}g
                                  {item.discount > 0 && <span className="text-red-400 ml-1">(-{item.discount})</span>}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {sale.discount > 0 ? <span className="text-red-400">${parseFloat(sale.discount).toFixed(2)}</span> : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gold">
                        ${parseFloat(sale.sale_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm max-w-xs truncate">
                        {sale.notes || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleEdit(sale)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                            title="Edit">
                            <FiEdit2 />
                          </button>
                          <button onClick={() => handleDelete(sale.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                            title="Delete">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSales.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  No sales found
                </div>
              )}
            </div>
          </>
        )}

      {showModal && (
        <SalesModal
          sale={editingSale}
          onClose={() => setShowModal(false)}
          onRefresh={fetchSales}
        />
      )}
    </div>
  );
};

export default Sales;
