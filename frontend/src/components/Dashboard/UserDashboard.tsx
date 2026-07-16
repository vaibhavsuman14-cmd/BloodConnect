import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BloodRequest, User } from '../../types';
import api from '../../services/api';
import socketService from '../../services/socket';
import { toast } from 'react-toastify';
import './Dashboard.css';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    setupSocketListeners();
    
    return () => {
      socketService.off('newBloodRequest');
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const [profileRes, requestsRes, emergencyRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/blood-requests/donor'),
        api.get('/blood-requests/emergency')
      ]);

      setProfile(profileRes.data);
      setBloodRequests(requestsRes.data);
      setEmergencyRequests(emergencyRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (user?.id) {
      socketService.connect(user.id);
      
      socketService.on('newBloodRequest', (data) => {
        toast.info(`🚨 New ${data.isEmergency ? 'EMERGENCY' : ''} blood request: ${data.bloodType} needed at ${data.hospital}`);
        fetchUserData(); // Refresh data
      });
    }
  };

  const toggleEmergencyContact = async () => {
    try {
      const response = await api.patch('/users/emergency-toggle');
      setProfile(prev => prev ? { ...prev, emergencyContact: !prev.emergencyContact } : null);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update emergency contact status');
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await api.patch('/users/availability-toggle');
      setProfile(prev => prev ? { ...prev, isAvailable: !prev.isAvailable } : null);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update availability status');
    }
  };

  const updateMaxDistance = async (distance: number) => {
    try {
      await api.patch('/users/max-distance', { maxDistance: distance });
      setProfile(prev => prev ? { ...prev, maxDistance: distance } : null);
      toast.success(`Max distance updated to ${distance} km`);
    } catch (error) {
      toast.error('Failed to update max distance');
    }
  };

  const respondToRequest = async (requestId: string, response: 'Confirmed' | 'Declined') => {
    try {
      await api.patch(`/blood-requests/${requestId}/respond`, { response });
      toast.success(`Response recorded: ${response}`);
      fetchUserData();
    } catch (error) {
      toast.error('Failed to respond to request');
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
        <h2>Donor Dashboard</h2>
        <p>Help save lives by donating blood</p>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-info">
          <h3>{profile?.name}</h3>
          <div className="blood-type">{profile?.bloodType}</div>
          <p>Donations: {profile?.donationCount || 0}</p>
          {profile?.lastDonation && (
            <p>Last donation: {new Date(profile.lastDonation).toLocaleDateString()}</p>
          )}
        </div>

        <div className="profile-controls">
          <div className="toggle-group">
            <label className="toggle">
              <input
                type="checkbox"
                checked={profile?.isAvailable || false}
                onChange={toggleAvailability}
              />
              <span className="toggle-slider"></span>
              Available for donation
            </label>

            <label className="toggle">
              <input
                type="checkbox"
                checked={profile?.emergencyContact || false}
                onChange={toggleEmergencyContact}
              />
              <span className="toggle-slider emergency"></span>
              Emergency contact
            </label>
          </div>

          <div className="distance-control">
            <label htmlFor="maxDistance">Max distance: {profile?.maxDistance || 10} km</label>
            <input
              type="range"
              id="maxDistance"
              min="1"
              max="50"
              value={profile?.maxDistance || 10}
              onChange={(e) => updateMaxDistance(parseInt(e.target.value))}
              className="distance-slider"
            />
          </div>
        </div>
      </div>

      {/* Emergency Requests */}
      {emergencyRequests.length > 0 && (
        <div className="emergency-section">
          <h3>🚨 Emergency Requests</h3>
          <div className="requests-grid">
            {emergencyRequests.slice(0, 3).map((request) => (
              <div key={request._id} className="request-card emergency">
                <div className="request-header">
                  <span className="blood-type">{request.bloodType}</span>
                  <span className="urgency" style={{ color: getUrgencyColor(request.urgency) }}>
                    {request.urgency}
                  </span>
                </div>
                <h4>{request.hospital.name}</h4>
                <p>{request.patientGender}, {request.patientAge} years</p>
                <p>{request.unitsNeeded} units needed</p>
                <p>Time remaining: {formatTimeRemaining(request.neededBy)}</p>
                <div className="request-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => respondToRequest(request._id, 'Confirmed')}
                  >
                    Confirm
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => respondToRequest(request._id, 'Declined')}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Blood Requests */}
      <div className="requests-section">
        <h3>My Blood Requests</h3>
        {bloodRequests.length === 0 ? (
          <p className="no-requests">No active blood requests for you.</p>
        ) : (
          <div className="requests-list">
            {bloodRequests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <span className="blood-type">{request.bloodType}</span>
                  <span className="urgency" style={{ color: getUrgencyColor(request.urgency) }}>
                    {request.urgency}
                  </span>
                </div>
                <h4>{request.hospital.name}</h4>
                <p>{request.description}</p>
                <p>{request.patientGender}, {request.patientAge} years</p>
                <p>{request.unitsNeeded} units needed</p>
                <p>Time remaining: {formatTimeRemaining(request.neededBy)}</p>
                
                <div className="contact-info">
                  <p>📞 {request.contactInfo.phone}</p>
                  <p>✉️ {request.contactInfo.email}</p>
                </div>

                <div className="request-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => respondToRequest(request._id, 'Confirmed')}
                  >
                    Confirm Donation
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => respondToRequest(request._id, 'Declined')}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;