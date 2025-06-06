import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../contexts/AuthContext';

interface AdminLoginProps {
  onClose: () => void;
  open: boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onClose, open }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onClose();
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #eee',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettingsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Admin Login
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              endAdornment: (
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((show) => !show)}
                  edge="end"
                  tabIndex={-1}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Stay logged in"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={onClose}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(90deg, #3758cd 0%, #c5006b 100%)',
              '&:hover': {
                background: 'linear-gradient(90deg, #c5006b 0%, #3758cd 100%)',
              },
            }}
          >
            Login
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdminLogin; 