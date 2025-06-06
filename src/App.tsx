import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import theme from './theme';
import StockInfo from './pages/StockInfo';
import Register from './pages/Register';
import { AuthProvider } from './contexts/AuthContext';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState(location.pathname === '/register' ? 1 : 0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    navigate(newValue === 0 ? '/' : '/register');
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        borderTop: '1px solid rgba(0, 0, 0, 0.12)',
        '& .MuiBottomNavigation-root': {
          height: 56,
          backgroundColor: 'background.paper'
        }
      }} 
      elevation={0}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px',
            '&.Mui-selected': {
              color: 'primary.main'
            }
          }
        }}
      >
        <BottomNavigationAction 
          label="Stock Info" 
          icon={<InventoryIcon />} 
          sx={{ 
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem'
            }
          }}
        />
        <BottomNavigationAction 
          label="Register" 
          icon={<AssignmentIcon />} 
          sx={{ 
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem'
            }
          }}
        />
      </BottomNavigation>
    </Paper>
  );
};

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', pb: { xs: 12, sm: 10 } }}>
              <Routes>
                <Route path="/" element={<StockInfo />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </Box>
            <Navigation />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 