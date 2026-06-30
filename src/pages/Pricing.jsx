import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiDollarSign, FiEdit2 } from 'react-icons/fi';

const headerBase = "text-left py-3 px-4 font-semibold text-gray-400";

const Pricing = () => {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchCurrentPrice();
  }, []);

  const fetchCurrentPrice = async () => {
    try {
      const response = await api.getCurrentPrice();
      setCurrentPrice(response.data);
    } catch (error) {
      toast.error('Failed to fetch price');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updatePrice({ amount: parseFloat(amount) });
      toast.success('Price updated successfully!');
      setCurrentPrice(response.data);
      setShowModal(false);
      setAmount('');
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Current Gold Price</h2>
        <p className="text-gray-400 mt-1">Update the current price per gram</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading price...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="md:col-span-2">
            <div className="card bg-gradient-to-br from-secondary to-primary border border-gold/20">
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <p className="text-gray-400 text-sm">Current Price Per Gram</p>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gold mt-2">
                    {formatCurrency(currentPrice?.amount)}
                  </h3>
                </div>
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FiDollarSign className="text-gold" size={24} />
                </div>
              </div>
              <p className="text-gray-500 text-sm">
                Last updated: {currentPrice?.updated_at 
                  ? new Date(currentPrice.updated_at).toLocaleString() 
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <button 
              onClick={() => {
                setAmount(currentPrice?.amount || '');
                setShowModal(true);
              }}
              className="btn-primary w-full py-4 lg:py-8 text-base lg:text-lg flex items-center justify-center space-x-2 lg:space-x-3"
            >
              <FiEdit2 />
              <span>Update Price</span>
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Update Price Per Gram</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field pl-10 text-lg"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;