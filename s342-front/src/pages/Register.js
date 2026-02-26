import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import authApi from '../api/api';
import { Alert, Box, Button, CircularProgress, Container, Grid, Link, Paper, TextField, Typography } from '@mui/material';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setToken, setRefreshToken } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.password2) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await authApi.register(formData);
            if (response.token) {
                setToken(response.token);
                setRefreshToken(response.refresh_token);
                navigate('/');
            } else {
                setError(response.error || 'Registration failed. Please try again.');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.password?.[0] ||
                           err.response?.data?.username?.[0] ||
                           err.response?.data?.email?.[0] ||
                           'Registration failed. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        Register
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            fullWidth
                            margin="normal"
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="First Name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    fullWidth
                                    margin="normal"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Last Name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    fullWidth
                                    margin="normal"
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Confirm Password"
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            required
                            fullWidth
                            margin="normal"
                        />
                        {error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                {error}
                            </Alert>
                        )}
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            sx={{ mt: 2 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                        </Button>
                    </Box>
                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        Already have an account?{' '}
                        <Link href="/login">Login here</Link>
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;
