import { useState, useEffect } from 'react';
import { authApi } from '../services/api';
import type { UserProfile } from '../services/api';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authApi.getProfile();
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box p={3}>
        <Alert severity="warning">No profile data available</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        
        <Box mt={3}>
          <Typography variant="subtitle1" color="text.secondary">
            Username
          </Typography>
          <Typography variant="body1" gutterBottom>
            {profile.username}
          </Typography>
        </Box>

        <Box mt={2}>
          <Typography variant="subtitle1" color="text.secondary">
            Email
          </Typography>
          <Typography variant="body1" gutterBottom>
            {profile.email}
          </Typography>
        </Box>

        <Box mt={2}>
          <Typography variant="subtitle1" color="text.secondary">
            Gender
          </Typography>
          <Typography variant="body1" gutterBottom>
            {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
          </Typography>
        </Box>

        <Box mt={2}>
          <Typography variant="subtitle1" color="text.secondary">
            Role
          </Typography>
          <Typography variant="body1" gutterBottom>
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </Typography>
        </Box>

        <Box mt={2}>
          <Typography variant="subtitle1" color="text.secondary">
            Member Since
          </Typography>
          <Typography variant="body1" gutterBottom>
            {new Date(profile.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
} 