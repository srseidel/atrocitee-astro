/**
 * Account Settings Form Component
 * 
 * Comprehensive user account settings with profile info, address, and charity selection
 */

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@lib/supabase/client';
import AddressInput from '@components/common/AddressInput';
import PhoneInput from '@components/common/PhoneInput';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  avatar_url: string | null;
  default_charity_id: string | null;
}

interface Charity {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface User {
  email: string;
  user_metadata: {
    display_name?: string;
    full_name?: string;
  };
}

export default function AccountSettingsForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(true);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get current user from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      if (!authUser) {
        window.location.href = '/auth/login';
        return;
      }

      setUser(authUser as User);

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
      }

      // If no profile exists, create a basic one
      if (!profileData) {
        const newProfile = {
          id: authUser.id,
          email: authUser.email!,
          first_name: null,
          last_name: null,
          display_name: authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || null,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          setProfile(newProfile as Profile);
        } else {
          setProfile(createdProfile);
        }
      } else {
        // Update email from auth if it's different
        if (profileData.email !== authUser.email) {
          profileData.email = authUser.email!;
        }
        setProfile(profileData);
      }

      // Load charities for dropdown
      const { data: charitiesData, error: charitiesError } = await supabase
        .from('charities')
        .select('id, name, description, active')
        .eq('active', true)
        .order('name');

      if (charitiesError) {
        console.error('Charities error:', charitiesError);
      } else {
        setCharities(charitiesData || []);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage({ type: 'error', text: 'Failed to load account information' });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;

    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const saveProfile = async () => {
    if (!profile || !user) return;

    // Check if address and phone are valid before saving
    if (!isAddressValid) {
      setMessage({ type: 'error', text: 'Please fix address validation errors before saving.' });
      return;
    }

    if (!isPhoneValid) {
      setMessage({ type: 'error', text: 'Please fix phone number validation errors before saving.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          display_name: profile.display_name,
          phone: profile.phone,
          address_line1: profile.address_line1,
          address_line2: profile.address_line2,
          city: profile.city,
          state: profile.state,
          postal_code: profile.postal_code,
          country: profile.country,
          default_charity_id: profile.default_charity_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update user metadata if display_name changed
      if (profile.display_name !== user.user_metadata?.display_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { display_name: profile.display_name }
        });

        if (authError) {
          console.error('Auth metadata update error:', authError);
        }
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Profile data:', profile);
      console.error('User data:', user);
      
      // Show more detailed error message
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      setMessage({ type: 'error', text: `Failed to save profile: ${errorMessage}` });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!user?.email) return;

    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Password reset email sent! Check your inbox for instructions.' 
      });
    } catch (error) {
      console.error('Error sending password reset:', error);
      setMessage({ type: 'error', text: 'Failed to send password reset email. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading account information...</span>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load account information. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Information Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email (read-only) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p className="text-sm text-gray-500 mt-1">
              Email is managed by your account authentication and cannot be changed here.
            </p>
          </div>

          {/* Display Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={profile.display_name || ''}
              onChange={(e) => updateProfile({ display_name: e.target.value || null })}
              placeholder="How you'd like to be addressed"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              This name will be shown on your account and any public interactions.
            </p>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={profile.first_name || ''}
              onChange={(e) => updateProfile({ first_name: e.target.value || null })}
              placeholder="Your first name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={profile.last_name || ''}
              onChange={(e) => updateProfile({ last_name: e.target.value || null })}
              placeholder="Your last name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div className="md:col-span-2">
            <PhoneInput
              value={profile.phone || ''}
              onChange={(value) => updateProfile({ phone: value || null })}
              onValidationChange={setIsPhoneValid}
              label="Phone Number"
              placeholder="(555) 123-4567"
              country="US"
              showValidation={true}
            />
          </div>
        </div>
      </div>

      {/* Address Information Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Address Information</h2>
        
        <AddressInput
          address={{
            address_line1: profile.address_line1 || '',
            address_line2: profile.address_line2 || '',
            city: profile.city || '',
            state: profile.state || '',
            postal_code: profile.postal_code || '',
            country: profile.country || 'US'
          }}
          onChange={(address) => {
            updateProfile({
              address_line1: address.address_line1 || null,
              address_line2: address.address_line2 || null,
              city: address.city || null,
              state: address.state || null,
              postal_code: address.postal_code || null,
              country: address.country || null
            });
          }}
          onValidationChange={setIsAddressValid}
          showValidation={true}
        />
      </div>

      {/* Charity Preference Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Charity Preference</h2>
        
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Default Charity
          </label>
          <select
            value={profile.default_charity_id || ''}
            onChange={(e) => updateProfile({ default_charity_id: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a charity (optional)</option>
            {charities.map((charity) => (
              <option key={charity.id} value={charity.id}>
                {charity.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">
            Choose a default charity that will receive donations from your purchases. 
            You can still choose different charities for individual orders.
          </p>
        </div>
      </div>

      {/* Password Management Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Password & Security</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              To change your password, we'll send you a secure reset link via email.
            </p>
            <button
              onClick={changePassword}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveProfile}
          disabled={saving || !isAddressValid || !isPhoneValid}
          className={`px-6 py-2 text-white rounded-lg focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            !isAddressValid || !isPhoneValid
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {saving ? 'Saving...' : 
           !isAddressValid ? 'Fix Address Errors' : 
           !isPhoneValid ? 'Fix Phone Number' : 
           'Save Changes'}
        </button>
      </div>
    </div>
  );
}