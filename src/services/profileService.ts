import API_ENDPOINTS from '../api/apiConfig';

export async function getProfile(token: string) {
    const response = await fetch(API_ENDPOINTS.profiles.profiles, {
      headers: {
        accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
  
    const result = await response.json();
    return result.data; 
  }

export async function getProfileGetRole(token: string) {
    const response = await fetch(API_ENDPOINTS.auth.profile, {
        headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }
    return response.json();
} 

export async function updateProfile(token: string, profileData: {
    first_name?: string;
    last_name?: string;
    mobile?: string;
    dob?: string;
}) {
    const response = await fetch(API_ENDPOINTS.profiles.profiles, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
    }

    const result = await response.json();
    return result;
}
