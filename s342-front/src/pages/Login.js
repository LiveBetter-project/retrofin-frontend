import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import API from '../api/api';
import { Box, Button, CircularProgress, Container, Link, Paper, TextField, Typography, Alert} from '@mui/material';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setToken, setRefreshToken } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await API.login({ username, password });
            if (response.token) {
                setToken(response.token);
                setRefreshToken(response.refresh_token);
                navigate('/');
            } else {
                setError(response.error || 'Login failed. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
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
                        Login
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                        </Button>
                    </Box>
                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        Don't have an account?{' '}
                        <Link href="/register">Register here</Link>
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
