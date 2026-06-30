import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiUser, FiPhone, FiCamera, FiLock, FiMapPin, FiPlus, FiDollarSign } from 'react-icons/fi';

const EmployeeModal = ({ employee, onClose, onRefresh }) => {
  const [branches, setBranches] = useState([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', location: '' });
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    branch_id: '',
    sales: '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
    if (employee) {
      setFormData({
        full_name: employee.full_name || '',
        phone_number: employee.phone_number || '',
        password: '',
        confirm_password: '',
        branch_id: employee.branch_id || '',
        sales: employee.sales || '',
      });
      if (employee.photo) {
        setPreview(`/uploads/${employee.photo}`);
      }
    }
  }, [employee]);

  const fetchBranches = async () => {
    try {
      const response = await api.getBranches();
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAddBranch = async () => {
    try {
      await api.addBranch(newBranch);
      toast.success('Branch added');
      setNewBranch({ name: '', location: '' });
      setShowAddBranch(false);
      fetchBranches();
    } catch (error) {
      toast.error('Failed to add branch');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employee && formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('phone_number', formData.phone_number);
      data.append('branch_id', formData.branch_id);
      data.append('sales', formData.sales);
      
      if (formData.password) {
        data.append('password', formData.password);
      }
      if (photo) {
        data.append('photo', photo);
      }

      if (employee) {
        await api.updateEmployee(employee.id, data);
        toast.success('Employee updated');
      } else {
        await api.addEmployee(data);
        toast.success('Employee added');
      }
      
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content !p-4 sm:!p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-xl font-bold text-white">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-primary rounded-lg text-gray-400">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" name="full_name" value={formData.full_name}
                  onChange={handleChange} className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" name="phone_number" value={formData.phone_number}
                  onChange={handleChange} className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password {employee && <span className="text-gray-500">(leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="password" value={formData.password}
                  onChange={handleChange} className="input-field pl-10"
                  required={!employee} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="confirm_password" value={formData.confirm_password}
                  onChange={handleChange} className="input-field pl-10"
                  required={!employee} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sales</label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="number" step="0.01" name="sales" value={formData.sales}
                onChange={handleChange} className="input-field pl-10" placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Photo</label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer flex items-center space-x-2 bg-primary px-4 py-2 rounded-lg hover:bg-secondary transition text-gray-300">
                <FiCamera />
                <span>Choose Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              {preview && (
                <img src={preview} alt="Preview" className="w-12 h-12 rounded-full object-cover" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Branch</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select name="branch_id" value={formData.branch_id}
                  onChange={handleChange} className="input-field pl-10" required>
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => setShowAddBranch(!showAddBranch)}
                className="btn-secondary">
                <FiPlus />
              </button>
            </div>

            {showAddBranch && (
              <div className="mt-2 p-4 bg-primary rounded-lg space-y-2">
                <input type="text" placeholder="Branch Name" value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="input-field" />
                <input type="text" placeholder="Location (optional)" value={newBranch.location}
                  onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                  className="input-field" />
                <button type="button" onClick={handleAddBranch}
                  className="btn-primary text-sm">
                  Add Branch
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : employee ? 'Update' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;