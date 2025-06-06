import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Paper,
  Button,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 'bold',
              letterSpacing: '0.5px',
            }}
          >
            Sahachari Register
          </Typography>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          pb: 10, // Add padding bottom to prevent content from being hidden behind navigation
        }}
      >
        {children}
      </Container>

      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          p: 1,
          borderRadius: 4,
          backgroundColor: 'background.paper',
          zIndex: 1000,
        }}
      >
        <Button
          variant={location.pathname === '/' ? 'contained' : 'text'}
          onClick={() => navigate('/')}
          startIcon={<InventoryIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold',
            minWidth: 140,
            '&.MuiButton-contained': {
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          }}
        >
          Stock Info
        </Button>
        <Button
          variant={location.pathname === '/register' ? 'contained' : 'text'}
          onClick={() => navigate('/register')}
          startIcon={<AssignmentIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold',
            minWidth: 140,
            '&.MuiButton-contained': {
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          }}
        >
          Register
        </Button>
      </Paper>
    </Box>
  );
};

export default Layout; 