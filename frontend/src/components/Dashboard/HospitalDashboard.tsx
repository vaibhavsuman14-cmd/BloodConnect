import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { BloodRequest, BloodType } from '../../types';
import api from '../../services/api';
import socketService from '../../services/socket';
import { toast } from 'react-toastify';
import './Dashboard.css';

interface BloodRequestForm {
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  bloodType: BloodType;
  unitsNeeded: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  neededBy: string;
  description: string;
  isEmergency: boolean;
  contactPhone: string;
  contactEmail: string;
}

const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BloodRequestForm>();

  useEffect(() => {
    fetchBloodRequests();
    setupSocketListeners();

    return () => {
      socketService.off('donorResponse');
    };
  }, []);

  const fetchBloodRequests = async () => {
    try {
      const response = await api.get('/blood-requests/hospital');
      setBloodRequests(response.data.requests);
    } catch (error) {
      toast.error('Failed to fetch blood requests');
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (user?.id) {
      socketService.connect(user.id);
      
      socketService.on('donorResponse', (data) => {
        toast.info(`${data.donorName} ${data.response.toLowerCase()} your blood request`);
        fetchBloodRequests(); // Refresh data
      });
    }
  };

  const onSubmit = async (data: BloodRequestForm) => {
    try {
      const requestData = {
        ...data,
        neededBy: new Date(data.neededBy).toISOString(),
        contactInfo: {
          phone: data.contactPhone,
          email: data.contactEmail
        }
      };

      const response = await api.post('/blood-requests', requestData);
      toast.success(`Blood request created! ${response.data.matchedDonorsCount} donors notified.`);
      setShowCreateForm(false);
      reset();
      fetchBloodRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create blood request');
    }
  };

  const markAsDonated = async (requestId: string, donorId: string) => {
    try {
      console.log('Marking as donated:', { requestId, donorId, donorIdType: typeof donorId });
      
      if (!donorId || donorId === 'undefined') {
        toast.error('Invalid donor ID');
        return;
      }
      
      await api.patch(`/blood-requests/${requestId}/donated/${donorId}`);
      toast.success('Donation recorded successfully!');
      fetchBloodRequests();
    } catch (error: any) {
      console.error('Mark as donated error:', error);
      toast.error(error.response?.data?.message || 'Failed to mark as donated');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      case 'Low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#3b82f6';
      case 'Partially Fulfilled': return '#eab308';
      case 'Fulfilled': return '#22c55e';
      case 'Expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatTimeRemaining = (neededBy: Date) => {
    const now = new Date();
    const target = new Date(neededBy);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)} days`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Hospital Dashboard</h2>
          <p>Manage blood requests and donations</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          + Create Blood Request
        </button>
      </div>

      {/* Create Request Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Blood Request</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="request-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Patient Name</label>
                  <input
                    {...register('patientName', { required: 'Patient name is required' })}
                    placeholder="Enter patient name"
                  />
                  {errors.patientName && <span className="error">{errors.patientName.message}</span>}
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    {...register('patientAge', { 
                      required: 'Age is required',
                      min: { value: 1, message: 'Age must be at least 1' },
                      max: { value: 120, message: 'Age must be less than 120' }
                    })}
                    placeholder="Enter age"
                  />
                  {errors.patientAge && <span className="error">{errors.patientAge.message}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select {...register('patientGender', { required: 'Gender is required' })}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.patientGender && <span className="error">{errors.patientGender.message}</span>}
                </div>

                <div className="form-group">
                  <label>Blood Type</label>
                  <select {...register('bloodType', { required: 'Blood type is required' })}>
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                  {errors.bloodType && <span className="error">{errors.bloodType.message}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Units Needed</label>
                  <input
                    type="number"
                    {...register('unitsNeeded', { 
                      required: 'Units needed is required',
                      min: { value: 1, message: 'At least 1 unit required' },
                      max: { value: 10, message: 'Maximum 10 units allowed' }
                    })}
                    placeholder="Enter units needed"
                  />
                  {errors.unitsNeeded && <span className="error">{errors.unitsNeeded.message}</span>}
                </div>

                <div className="form-group">
                  <label>Urgency</label>
                  <select {...register('urgency', { required: 'Urgency is required' })}>
                    <option value="">Select urgency</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  {errors.urgency && <span className="error">{errors.urgency.message}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Needed By</label>
                  <input
                    type="datetime-local"
                    {...register('neededBy', { required: 'Needed by date is required' })}
                  />
                  {errors.neededBy && <span className="error">{errors.neededBy.message}</span>}
                </div>

                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    {...register('isEmergency')}
                  />
                  <label>Emergency Request</label>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Describe the medical condition and urgency"
                  rows={3}
                />
                {errors.description && <span className="error">{errors.description.message}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    {...register('contactPhone', { required: 'Contact phone is required' })}
                    placeholder="Enter contact phone"
                  />
                  {errors.contactPhone && <span className="error">{errors.contactPhone.message}</span>}
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    {...register('contactEmail', { required: 'Contact email is required' })}
                    placeholder="Enter contact email"
                  />
                  {errors.contactEmail && <span className="error">{errors.contactEmail.message}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blood Requests List */}
      <div className="requests-section">
        <h3>My Blood Requests</h3>
        {bloodRequests.length === 0 ? (
          <p className="no-requests">No blood requests created yet.</p>
        ) : (
          <div className="requests-list">
            {bloodRequests.map((request) => (
              <div key={request._id} className="request-card hospital">
                <div className="request-header">
                  <div className="request-meta">
                    <span className="blood-type">{request.bloodType}</span>
                    <span className="urgency" style={{ color: getUrgencyColor(request.urgency) }}>
                      {request.urgency}
                    </span>
                    <span className="status" style={{ color: getStatusColor(request.status) }}>
                      {request.status}
                    </span>
                    {request.isEmergency && <span className="emergency-badge">🚨 EMERGENCY</span>}
                  </div>
                  <div className="time-remaining">
                    {formatTimeRemaining(request.neededBy)}
                  </div>
                </div>

                <h4>Patient: {request.patientName}</h4>
                <p>{request.patientGender}, {request.patientAge} years</p>
                <p>{request.description}</p>
                <p>{request.unitsNeeded} units needed</p>

                <div className="contact-info">
                  <p>📞 {request.contactInfo.phone}</p>
                  <p>✉️ {request.contactInfo.email}</p>
                </div>

                <div className="matched-donors">
                  <h5>Matched Donors ({request.matchedDonors.length})</h5>
                  {request.matchedDonors.length === 0 ? (
                    <p>No donors matched yet.</p>
                  ) : (
                    <div className="donors-list">
                      {request.matchedDonors.map((match, index) => (
                        <div key={index} className="donor-item">
                          <div className="donor-info">
                            <span className="donor-name">{match.donor.name}</span>
                            <span className="donor-phone">{match.donor.phone}</span>
                            <span className="donor-blood">{match.donor.bloodType}</span>
                          </div>
                          <div className="donor-status">
                            <span className={`status-badge ${match.status.toLowerCase()}`}>
                              {match.status}
                            </span>
                            {match.status === 'Confirmed' && (
                              <button
                                className="btn-small"
                                onClick={() => {
                                  const donorId = match.donor._id || match.donor.id;
                                  console.log('Donor object:', match.donor);
                                  console.log('Extracted donor ID:', donorId);
                                  markAsDonated(request._id, donorId);
                                }}
                              >
                                Mark as Donated
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;