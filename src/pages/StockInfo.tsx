import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ItemCard from '../components/ItemCard';
import { Item } from '../types';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const StockInfo: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemTotal, setNewItemTotal] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [logoOpen, setLogoOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { isAdmin, isSuperAdmin, currentUser, logout } = useAuth();
  const theme = useTheme();

  // Fetch items from Firestore in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'items'), (snapshot) => {
      setItems(snapshot.docs.map(doc => doc.data() as Item));
    });
    return () => unsub();
  }, []);

  // Sort items alphabetically
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      const updatedItems = items.filter(item => item.id !== itemToDelete);
      setItems(updatedItems);
      setItemToDelete(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleAddSubmit = () => {
    if (newItemName && newItemTotal) {
      const total = parseInt(newItemTotal);
      const newItem: Item = {
        id: (items.length + 1).toString(),
        name: newItemName,
        total,
        issued: 0,
        available: total,
        imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : '/images/placeholder.jpg',
      };
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      setIsAddDialogOpen(false);
      setNewItemName('');
      setNewItemTotal('');
      setSelectedImage(null);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  const handleLoginClick = () => {
    if (isAdmin) {
      setIsLogoutDialogOpen(true);
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 1, sm: 3 },
        pb: { xs: 14, sm: 12 },
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      {/* Minimal Stylish Heading with Logo */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src="/logo.png"
            alt="SKSSF Logo"
            sx={{
              width: { xs: 40, sm: 64 },
              height: { xs: 40, sm: 64 },
              borderRadius: '50%',
              mr: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              background: 'white',
              objectFit: 'cover',
              cursor: 'pointer',
              transition: 'transform 0.18s',
              '&:hover': {
                transform: 'scale(1.08)',
                boxShadow: '0 4px 16px rgba(55,88,205,0.18)',
              },
            }}
            onClick={() => setLogoOpen(true)}
          />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                fontFamily: 'Montserrat, Roboto, sans-serif',
                color: 'primary.main',
                mb: 0.2,
                fontSize: { xs: '1.1rem', sm: '1.5rem' },
              }}
            >
              SAHACHARI CENTER KARAYA
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 400,
                letterSpacing: 0.5,
                fontFamily: 'Montserrat, Roboto, sans-serif',
                color: 'text.secondary',
                opacity: 0.95,
              }}
            >
              An organization by SKSSF Kodasseri unit
            </Typography>
          </Box>
        </Box>

        {/* Admin Login Button */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <IconButton
            onClick={handleLoginClick}
            sx={{
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.light'
              }
            }}
          >
            {/* Admin Panel Icon */}
          </IconButton>
        </Box>
      </Box>

      {/* Logo Popup Dialog */}
      <Dialog
        open={logoOpen}
        onClose={() => setLogoOpen(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(55,88,205,0.18)',
            animation: `${theme.transitions.create(['transform', 'opacity'], {
              duration: 350,
              easing: theme.transitions.easing.easeOut,
            })} popIn`,
            '@keyframes popIn': {
              '0%': { opacity: 0, transform: 'scale(0.7)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="SKSSF Logo Large"
            sx={{
              width: 220,
              height: 220,
              borderRadius: '50%',
              boxShadow: '0 4px 24px rgba(197,0,107,0.13)',
              background: 'white',
              objectFit: 'cover',
              mb: 2,
            }}
          />
          <Button
            variant="contained"
            color="primary"
            href="/logo.png"
            download="SKSSF_Kodasseri_logo.png"
            sx={{
              background: 'linear-gradient(90deg, #3758cd 0%, #c5006b 100%)',
              color: 'white',
              fontWeight: 600,
              borderRadius: 3,
              px: 3,
              py: 1.2,
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(55,88,205,0.10)',
              '&:hover': {
                background: 'linear-gradient(90deg, #c5006b 0%, #3758cd 100%)',
              },
            }}
          >
            Download Logo
          </Button>
        </Box>
      </Dialog>

      {/* Admin Login Dialog */}
      <Dialog 
        open={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      >
        {/* Login form content */}
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog 
        open={isLogoutDialogOpen} 
        onClose={() => setIsLogoutDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(55,88,205,0.13)',
            overflow: 'hidden',
            minWidth: 340,
          }
        }}
      >
        <Box sx={{
          bgcolor: isSuperAdmin ? 'primary.main' : 'secondary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 2,
        }}>
          {/* Admin Panel Icon */}
        </Box>
        <DialogContent sx={{ pt: 3, pb: 1, px: 4, textAlign: 'center' }}>
          {isSuperAdmin ? (
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 500, color: 'primary.main', mb: 2 }}>
              You are logged in as <strong>Super Admin</strong>.<br />You have <span style={{ color: '#c5006b', fontWeight: 700 }}>All privileges</span>.
            </Typography>
          ) : (
            <>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 500, color: 'secondary.main', mb: 2 }}>
                Hey Admin!<br />You are already logged in with <strong>{currentUser?.email}</strong>.
              </Typography>
              <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                Do you want to log out?
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #eee', justifyContent: 'center' }}>
          <Button 
            onClick={() => setIsLogoutDialogOpen(false)}
            sx={{ borderRadius: 2, minWidth: 100 }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              logout();
              setIsLogoutDialogOpen(false);
            }}
            variant="contained"
            color={isSuperAdmin ? 'primary' : 'secondary'}
            sx={{ borderRadius: 2, minWidth: 100, fontWeight: 600 }}
          >
            Log out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modern Item Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 4,
          p: { xs: 1, sm: 2 },
        }}
      >
        {sortedItems.map((item) => (
          <Box key={item.id} sx={{ position: 'relative' }}>
            {isSuperAdmin && (
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
                onClick={() => handleDeleteItem(item.id)}
              >
                <DeleteIcon color="error" />
              </IconButton>
            )}
            <Box
              sx={{
                transition: 'transform 0.18s, box-shadow 0.18s',
                borderRadius: 4,
                boxShadow: '0 2px 12px rgba(67, 206, 162, 0.10)',
                '&:hover': {
                  transform: 'translateY(-6px) scale(1.03)',
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.13)',
                },
                bgcolor: 'white',
                p: 1,
              }}
            >
              <ItemCard item={item} />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Total Quantity"
            type="number"
            fullWidth
            value={newItemTotal}
            onChange={(e) => setNewItemTotal(e.target.value)}
            inputProps={{ min: 0 }}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2 }}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          {selectedImage && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {selectedImage.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this item? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockInfo; 