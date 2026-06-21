const API_URL = (import.meta.env.VITE_API_URL || 'https://bulkmailer-wxyb.onrender.com') + '/api';

const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'x-auth-token': token } : {})
  };
};

export const createCampaign = async (userId, metadata, recipients) => {
  const res = await fetch(`${API_URL}/campaigns`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ metadata, recipients })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create campaign');
  }
  const data = await res.json();
  return data.id;
};

export const updateCampaignStatus = async (campaignId, status) => {
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    throw new Error('Failed to update campaign status');
  }
};

export const updateRecipientStatus = async (campaignId, recipientId, statusInfo) => {
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/recipients/${recipientId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status: statusInfo.status, message: statusInfo.message })
  });
  if (!res.ok) {
    throw new Error('Failed to update recipient status');
  }
};

// Polling replacements for Firebase real-time onSnapshot listeners
export const subscribeToCampaign = (campaignId, callback) => {
  let isSubscribed = true;

  const poll = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`${API_URL}/campaigns/${campaignId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        callback({ id: data.campaign._id, ...data.campaign });
      }
    } catch (err) {
      console.error('Poll campaign error:', err);
    }
    if (isSubscribed) setTimeout(poll, 3000);
  };
  poll();

  return () => { isSubscribed = false; };
};

export const subscribeToRecipients = (campaignId, callback) => {
  let isSubscribed = true;

  const poll = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`${API_URL}/campaigns/${campaignId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.recipients.map(r => ({ id: r._id, ...r.data, ...r }));
        callback(formatted);
      }
    } catch (err) {
      console.error('Poll recipients error:', err);
    }
    if (isSubscribed) setTimeout(poll, 3000);
  };
  poll();

  return () => { isSubscribed = false; };
};

export const getUserCampaigns = async (userId) => {
  const res = await fetch(`${API_URL}/campaigns`, { headers: getHeaders() });
  if (!res.ok) {
    throw new Error('Failed to fetch campaigns');
  }
  const campaigns = await res.json();
  return campaigns.map(c => ({
    id: c._id,
    ...c,
    date: new Date(c.createdAt).toLocaleDateString()
  }));
};
