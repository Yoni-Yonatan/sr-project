import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiPhone, FiCamera, FiLock, FiMapPin, FiUserPlus } from 'react-icons/fi';

const SignUp = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    branch_id: '',
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('phone_number', formData.phone_number);
      data.append('password', formData.password);
      data.append('branch_id', formData.branch_id);
      if (photo) data.append('photo', photo);

      await api.signup(data);
      toast.success('Account created successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="bg-secondary rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-md border border-gold/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2">Join Jewelry Admin System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Photo</label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" name="password" value={formData.password}
                onChange={handleChange} className="input-field pl-10" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" name="confirm_password" value={formData.confirm_password}
                onChange={handleChange} className="input-field pl-10" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Branch</label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select name="branch_id" value={formData.branch_id}
                onChange={handleChange} className="input-field pl-10" required>
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2 mt-6">
            <FiUserPlus />
            <span>{loading ? 'Creating...' : 'Create Account'}</span>
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-gold hover:text-gold-dark font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;