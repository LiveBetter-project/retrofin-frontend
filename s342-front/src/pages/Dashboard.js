import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import authApi from '../api/api';
import { Alert, Box, Button, CircularProgress, Container, Divider, Paper, Stack, Typography} from '@mui/material';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { setToken, setRefreshToken, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userData = await authApi.getProfile();
                setUser(userData);
                console.log('user:', userData);
            } catch (err) {
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [token]);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setToken(null);
            setRefreshToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Dashboard
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {user && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                Welcome, {user.username}!
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Stack spacing={1}>
                                <Typography><strong>Email:</strong> {user.email}</Typography>
                                {user.first_name && (
                                    <Typography><strong>First Name:</strong> {user.first_name}</Typography>
                                )}
                                {user.last_name && (
                                    <Typography><strong>Last Name:</strong> {user.last_name}</Typography>
                                )}
                                <Typography>
                                    <strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}
                                </Typography>
                            </Stack>
                        </Box>
                    )}
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button variant="contained" onClick={() => navigate('/profile')}>
                            View Profile
                        </Button>
                        <Button variant="contained" color="error" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Container>
    );
};

export default Dashboard;
