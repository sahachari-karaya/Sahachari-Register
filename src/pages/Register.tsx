import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  SelectChangeEvent,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Grid,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReturnIcon from '@mui/icons-material/AssignmentReturn';
import UndoIcon from '@mui/icons-material/Undo';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import { Item } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { alpha } from '@mui/material/styles';
import { db } from '../firebase';
import { collection, setDoc, doc, onSnapshot, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';

interface Transaction {
  id: string;
  details: {
    name: string;
    place: string;
    phone: string;
  };
  issuedItems: string[];
  returnedItems: string[];
  dealerName: string;
  issueDate: string;
  returnDate: string;
  status: 'Issued' | 'Returned';
  inCareOf: string;
}

const Register: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [isUndoReturnDialogOpen, setIsUndoReturnDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Transaction | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [returnDate, setReturnDate] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [newIssued, setNewIssued] = useState<string>('');
  const [newAvailable, setNewAvailable] = useState<string>('');
  const [newTotal, setNewTotal] = useState<string>('');
  const [entryToUndo, setEntryToUndo] = useState<Transaction | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [inProcessSearch, setInProcessSearch] = useState('');
  const [completedSearch, setCompletedSearch] = useState('');
  const [showInProcessSearch, setShowInProcessSearch] = useState(false);
  const [showCompletedSearch, setShowCompletedSearch] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    place: '',
    phone: '',
    inCareOf: '',
    selectedItems: [''],
    issueDate: '',
    returnDate: new Date().toISOString().split('T')[0],
  });

  // Validation states
  const [errors, setErrors] = useState({
    name: '',
    place: '',
    phone: '',
    selectedItems: '',
    issueDate: '',
  });

  const { isAdmin, isSuperAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Fetch items and transactions from Firestore in real-time
    const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
      setItems(snapshot.docs.map(doc => doc.data() as Item));
    });
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
    });
    return () => {
      unsubItems();
      unsubTx();
    };
  }, []);

  const validateForm = () => {
    const newErrors = {
      name: '',
      place: '',
      phone: '',
      selectedItems: '',
      issueDate: '',
    };

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.place) newErrors.place = 'Place is required';
    if (!formData.phone) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    if (formData.selectedItems.every(item => !item)) {
      newErrors.selectedItems = 'Please select at least one item';
    }
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const capitalizeWords = (str: string) => (str.split(" ").map(word => (word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())).join(" "));

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      // Only allow digits
      if (!/^\d*$/.test(value)) return;
    }
    
    // Capitalize each word for name, place, and inCareOf
    if (['name', 'place', 'inCareOf'].includes(field)) {
      value = capitalizeWords(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const setTodayDate = () => {
    setFormData(prev => ({
      ...prev,
      issueDate: new Date().toISOString().split('T')[0]
    }));
  };

  const handleAddTransaction = async () => {
    if (!validateForm()) return;
    const newTransactions = formData.selectedItems
      .filter(item => item)
      .map(item => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        details: {
          name: formData.name,
          place: formData.place,
          phone: formData.phone,
        },
        issuedItems: [item],
        returnedItems: [],
        dealerName: formData.name,
        issueDate: formData.issueDate,
        returnDate: '',
        status: 'Issued' as const,
        inCareOf: formData.inCareOf,
      }));
    // Update stock items in Firestore
    for (const item of items) {
      const issuedCount = formData.selectedItems.filter(selectedItem => selectedItem === item.name).length;
      if (issuedCount > 0) {
        await setDoc(doc(collection(db, 'items'), item.id), {
          ...item,
          issued: item.issued + issuedCount,
          available: item.available - issuedCount,
        });
      }
    }
    // Add transactions to Firestore
    for (const tx of newTransactions) {
      await setDoc(doc(collection(db, 'transactions'), tx.id), tx);
    }
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleReturnItems = async () => {
    if (!selectedTransaction || !formData.selectedItems.some(item => item)) return;
    const updatedTransaction = {
      ...selectedTransaction,
      returnedItems: formData.selectedItems.filter(item => item),
      returnDate: formData.returnDate,
      status: 'Returned' as const,
    };
    // Update stock items in Firestore
    for (const item of items) {
      const issuedCount = formData.selectedItems.filter(selectedItem => selectedItem === item.name).length;
      if (issuedCount > 0) {
        await setDoc(doc(collection(db, 'items'), item.id), {
          ...item,
          issued: Math.max(0, item.issued - issuedCount),
          available: item.available + issuedCount,
        });
      }
    }
    // Update transaction in Firestore
    await setDoc(doc(collection(db, 'transactions'), selectedTransaction.id), updatedTransaction);
    setIsReturnDialogOpen(false);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    // Update stock items in Firestore
    for (const item of items) {
      const issuedCount = selectedTransaction.issuedItems.filter(selectedItem => selectedItem === item.name).length;
      if (issuedCount > 0) {
        await setDoc(doc(collection(db, 'items'), item.id), {
          ...item,
          issued: Math.max(0, item.issued - issuedCount),
          available: item.available + issuedCount,
        });
      }
    }
    // Delete transaction from Firestore
    await deleteDoc(doc(collection(db, 'transactions'), selectedTransaction.id));
    setIsDeleteConfirmOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      place: '',
      phone: '',
      inCareOf: '',
      selectedItems: [''],
      issueDate: '',
      returnDate: new Date().toISOString().split('T')[0],
    });
    setErrors({
      name: '',
      place: '',
      phone: '',
      selectedItems: '',
      issueDate: '',
    });
  };

  const handleSpeedDialOpen = () => setIsSpeedDialOpen(true);
  const handleSpeedDialClose = () => setIsSpeedDialOpen(false);

  const handleItemSelect = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const addItemField = () => {
    setFormData(prev => ({
      ...prev,
      selectedItems: [...prev.selectedItems, '']
    }));
  };

  const removeItemField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((_, i) => i !== index)
    }));
  };

  const loadAllEntries = () => {
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      try {
        const parsedTransactions = JSON.parse(storedTransactions);
        console.log('All saved transactions:', parsedTransactions);
        setShowAllEntries(true);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    }
  };

  // Add date formatting function
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Sort transactions by date and time
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.issueDate).getTime();
      const dateB = new Date(b.issueDate).getTime();
      return dateB - dateA;
    });
  }, [transactions]);

  const handleUndoReturn = async (entry: Transaction) => {
    if (!entry.returnDate) return;
    // Update transaction in Firestore
    await setDoc(doc(collection(db, 'transactions'), entry.id), {
      ...entry,
      returnDate: '',
      status: 'Issued',
    });
    // Update the item's issued count in Firestore
    const item = items.find((i) => i.name === entry.issuedItems[0]);
    if (item) {
      await setDoc(doc(collection(db, 'items'), item.id), {
        ...item,
        issued: item.issued + 1,
        available: Math.max(0, item.available - 1),
      });
    }
    setIsUndoReturnDialogOpen(false);
    setEntryToUndo(null);
  };

  // Search filter function
  const filterTransactions = (transactions: Transaction[], searchTerm: string) => {
    if (!searchTerm) return transactions;
    
    const searchLower = searchTerm.toLowerCase();
    return transactions.filter(transaction => 
      transaction.details.name.toLowerCase().includes(searchLower) ||
      transaction.details.place.toLowerCase().includes(searchLower) ||
      transaction.details.phone.includes(searchTerm) ||
      transaction.issuedItems.some(item => item.toLowerCase().includes(searchLower)) ||
      transaction.inCareOf.toLowerCase().includes(searchLower)
    );
  };

  // Highlight search text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ?
        <Box component="span" key={i} sx={{ bgcolor: 'yellow', color: 'black', borderRadius: 0.5, px: 0.2 }}>{part}</Box> :
        part
    );
  };

  const resyncItemCounts = async () => {
    try {
      // 1. Fetch all items and transactions from Firestore
      const itemsSnapshot = await getDocs(collection(db, 'items'));
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));

      const items = itemsSnapshot.docs.map(doc => doc.data() as Item);
      const transactions = transactionsSnapshot.docs.map(doc => doc.data() as Transaction);

      // 2. Calculate the correct issued count for each item based on transactions
      const issuedCounts: { [itemName: string]: number } = {};

      transactions.forEach(tx => {
        // Only count items in transactions with 'Issued' status
        if (tx.status === 'Issued') {
          tx.issuedItems.forEach(item => {
            issuedCounts[item] = (issuedCounts[item] || 0) + 1;
          });
        }
      });

      // 3. Update each item in Firestore with the correct issued and available counts
      for (const item of items) {
        const correctIssued = issuedCounts[item.name] || 0;
        const correctAvailable = item.total - correctIssued;

        // Only update if the counts are different from current Firestore data
        if (item.issued !== correctIssued || item.available !== correctAvailable) {
          const itemRef = doc(collection(db, 'items'), item.id);
          await updateDoc(itemRef, {
            issued: correctIssued,
            available: correctAvailable,
          });
          console.log(`Updated ${item.name}: Issued ${correctIssued}, Available ${correctAvailable}`);
        }
      }

      alert('Item counts resynchronized successfully!');
    } catch (error) {
      console.error('Error during item count resynchronization:', error);
      alert('Resynchronization failed. Check console for details.');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedTransaction || !validateForm()) return;

    const originalIssuedItems = selectedTransaction.issuedItems;
    const editedIssuedItems = formData.selectedItems.filter(item => item); // Filter out empty strings

    // Find items that were removed
    const removedItems = originalIssuedItems.filter(item => !editedIssuedItems.includes(item));

    // Find items that were added
    const addedItems = editedIssuedItems.filter(item => !originalIssuedItems.includes(item));

    // Update stock counts in Firestore based on changes
    // Increase count for added items
    for (const itemName of addedItems) {
      const itemToUpdate = items.find(item => item.name === itemName);
      if (itemToUpdate) {
        const itemRef = doc(collection(db, 'items'), itemToUpdate.id);
        await updateDoc(itemRef, {
          issued: itemToUpdate.issued + 1,
          available: itemToUpdate.available - 1,
        });
      }
    }

    // Decrease count for removed items
    for (const itemName of removedItems) {
      const itemToUpdate = items.find(item => item.name === itemName);
      if (itemToUpdate) {
        const itemRef = doc(collection(db, 'items'), itemToUpdate.id);
        await updateDoc(itemRef, {
          issued: Math.max(0, itemToUpdate.issued - 1), // Ensure issued doesn't go below 0
          available: itemToUpdate.available + 1,
        });
      }
    }

    // Update the transaction document in Firestore
    const updatedTransaction = {
      ...selectedTransaction,
      details: {
        name: formData.name,
        place: formData.place,
        phone: formData.phone,
      },
      inCareOf: formData.inCareOf,
      issuedItems: editedIssuedItems, // Save the filtered items
      issueDate: formData.issueDate,
      // returnDate is not changed in this dialog
    };
    await setDoc(doc(collection(db, 'transactions'), selectedTransaction.id), updatedTransaction);

    setIsEditDialogOpen(false);
    resetForm();
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Temporary Button to Resync Item Counts */}
      <Button variant="contained" color="primary" onClick={resyncItemCounts} sx={{ mb: 2 }}>
        Resync Item Counts
      </Button>
      {/* In Process Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box sx={{ 
              width: 8, 
              height: 24, 
              bgcolor: 'primary.main', 
              borderRadius: 1 
            }} />
            In Process
          </Typography>
          {showInProcessSearch ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={inProcessSearch}
                autoFocus
                onChange={(e) => setInProcessSearch(e.target.value)}
                sx={{
                  width: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <IconButton onClick={() => { setShowInProcessSearch(false); setInProcessSearch(''); }}>
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  boxShadow: '0 2px 8px rgba(55,88,205,0.2)',
                  letterSpacing: '0.5px'
                }}
              >
                {sortedTransactions.filter(transaction => transaction.status === 'Issued').length}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.9,
                    fontWeight: 500,
                    letterSpacing: '0.5px'
                  }}
                >
                  Entries
                </Typography>
              </Typography>
              <IconButton onClick={() => setShowInProcessSearch(true)}>
                <SearchIcon />
              </IconButton>
            </Box>
          )}
        </Box>
        {isMobile ? (
          <Box>
            {filterTransactions(
              sortedTransactions.filter(transaction => transaction.status === 'Issued'),
              inProcessSearch
            ).map((transaction) => (
              <Card key={transaction.id} sx={{
                mb: 1.2,
                borderRadius: 3,
                boxShadow: 4,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.13),
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.09)}, #fff 80%)`,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                p: 1
              }}>
                <CardContent sx={{ flex: 1, pr: 0, pb: 0.5, pt: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.05, fontSize: '1.15rem' }}>
                    {highlightText(transaction.details.name, inProcessSearch)}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.1, fontSize: '1.02rem' }}>
                    {highlightText(transaction.details.place, inProcessSearch)}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.02rem' }}>
                    {highlightText(transaction.details.phone, inProcessSearch)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 500, mb: 0.3, fontSize: '1.18rem', letterSpacing: 0.2 }}>
                    {highlightText(transaction.issuedItems.join(', '), inProcessSearch)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.98rem', mb: 0.1, display: 'block' }}>
                    Care Of: {highlightText(transaction.inCareOf, inProcessSearch)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.98rem', display: 'block' }}>
                    Issued date: {formatDate(transaction.issueDate)}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Box
                      sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        px: 1,
                        py: 0.4,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    >
                      {transaction.status}
                    </Box>
                  </Box>
                </CardContent>
                {isAdmin && (
                  <CardActions sx={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', pr: 0.5, pt: 0, gap: 2, borderRadius: 0 }}>
                    <IconButton
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsDeleteConfirmOpen(true);
                      }}
                      sx={{ color: 'error.main', mb: 0 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsEditDialogOpen(true);
                        setFormData({
                          name: transaction.details.name,
                          place: transaction.details.place,
                          phone: transaction.details.phone,
                          inCareOf: transaction.inCareOf,
                          selectedItems: transaction.issuedItems,
                          issueDate: transaction.issueDate,
                          returnDate: transaction.returnDate || new Date().toISOString().split('T')[0],
                        });
                      }}
                      sx={{ color: 'primary.main', mb: 0 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsReturnDialogOpen(true);
                        setFormData(prev => ({
                          ...prev,
                          returnDate: '',
                          selectedItems: transaction.issuedItems
                        }));
                      }}
                      sx={{ color: 'success.main', mb: 0 }}
                    >
                      <ReturnIcon sx={{ fontSize: 24 }} />
                    </IconButton>
                  </CardActions>
                )}
              </Card>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 3,
              mb: 2,
            }}
          >
            {filterTransactions(
              sortedTransactions.filter(transaction => transaction.status === 'Issued'),
              inProcessSearch
            ).map((transaction) => (
              <Card key={transaction.id} sx={{
                borderRadius: 3,
                boxShadow: 4,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.13),
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.09)}, #fff 80%)`,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                p: 1
              }}>
                <CardContent sx={{ flex: 1, pr: 0, pb: 0.5, pt: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.05, fontSize: '1.15rem' }}>
                    {highlightText(transaction.details.name, inProcessSearch)}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.1, fontSize: '1.02rem' }}>
                    {highlightText(transaction.details.place, inProcessSearch)}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.02rem' }}>
                    {highlightText(transaction.details.phone, inProcessSearch)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 500, mb: 0.3, fontSize: '1.18rem', letterSpacing: 0.2 }}>
                    {highlightText(transaction.issuedItems.join(', '), inProcessSearch)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.98rem', mb: 0.1, display: 'block' }}>
                    Care Of: {highlightText(transaction.inCareOf, inProcessSearch)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.98rem', display: 'block' }}>
                    Issued date: {formatDate(transaction.issueDate)}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Box
                      sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        px: 1,
                        py: 0.4,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    >
                      {transaction.status}
                    </Box>
                  </Box>
                </CardContent>
                {isAdmin && (
                  <CardActions sx={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', pr: 0.5, pt: 0, gap: 2, borderRadius: 0 }}>
                    <IconButton
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsDeleteConfirmOpen(true);
                      }}
                      sx={{ color: 'error.main', mb: 0 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsEditDialogOpen(true);
                        setFormData({
                          name: transaction.details.name,
                          place: transaction.details.place,
                          phone: transaction.details.phone,
                          inCareOf: transaction.inCareOf,
                          selectedItems: transaction.issuedItems,
                          issueDate: transaction.issueDate,
                          returnDate: transaction.returnDate || new Date().toISOString().split('T')[0],
                        });
                      }}
                      sx={{ color: 'primary.main', mb: 0 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsReturnDialogOpen(true);
                        setFormData(prev => ({
                          ...prev,
                          returnDate: '',
                          selectedItems: transaction.issuedItems
                        }));
                      }}
                      sx={{ color: 'success.main', mb: 0 }}
                    >
                      <ReturnIcon sx={{ fontSize: 24 }} />
                    </IconButton>
                  </CardActions>
                )}
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Completed Section */}
      <Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: '#c5006b',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Box sx={{ 
                width: 8, 
                height: 24, 
                bgcolor: '#c5006b', 
                borderRadius: 1 
              }} />
              Completed
            </Typography>
            <IconButton 
              onClick={() => setShowCompleted(!showCompleted)}
              sx={{ 
                color: '#c5006b',
                '&:hover': { bgcolor: '#f5e0ee' }
              }}
            >
              {showCompleted ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          {showCompletedSearch ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={completedSearch}
                autoFocus
                onChange={(e) => setCompletedSearch(e.target.value)}
                sx={{
                  width: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <IconButton onClick={() => { setShowCompletedSearch(false); setCompletedSearch(''); }}>
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  bgcolor: '#c5006b',
                  color: 'white',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  boxShadow: '0 2px 8px rgba(197,0,107,0.2)',
                  letterSpacing: '0.5px'
                }}
              >
                {sortedTransactions.filter(transaction => transaction.status === 'Returned').length}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.9,
                    fontWeight: 500,
                    letterSpacing: '0.5px'
                  }}
                >
                  Entries
                </Typography>
              </Typography>
              <IconButton onClick={() => setShowCompletedSearch(true)}>
                <SearchIcon />
              </IconButton>
            </Box>
          )}
        </Box>
        {showCompleted && (
          isMobile ? (
            <Box>
              {filterTransactions(
                sortedTransactions.filter(transaction => transaction.status === 'Returned'),
                completedSearch
              ).map((transaction) => (
                <Card key={transaction.id} sx={{
                  mb: 1.2,
                  borderRadius: 3,
                  boxShadow: 4,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.13),
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.09)}, #fff 80%)`,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  p: 1
                }}>
                  <CardContent sx={{ flex: 1, pr: 0, pb: 0.5, pt: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.05, fontSize: '1.15rem' }}>
                      {highlightText(transaction.details.name, completedSearch)}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.1, fontSize: '1.02rem' }}>
                      {highlightText(transaction.details.place, completedSearch)}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.02rem' }}>
                      {highlightText(transaction.details.phone, completedSearch)}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 500, mb: 0.3, fontSize: '1.18rem', letterSpacing: 0.2 }}>
                      {highlightText(transaction.issuedItems.join(', '), completedSearch)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.98rem', mb: 0.1, display: 'block' }}>
                      Care Of: {highlightText(transaction.inCareOf, completedSearch)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.98rem', display: 'block' }}>
                      Issued date: {formatDate(transaction.issueDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.98rem', display: 'block', fontWeight: 700 }}>
                      Returned: {formatDate(transaction.returnDate)}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Box
                        sx={{
                          bgcolor: 'success.main',
                          color: 'white',
                          px: 1,
                          py: 0.4,
                          borderRadius: 1,
                          display: 'inline-block',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        {transaction.status}
                      </Box>
                    </Box>
                  </CardContent>
                  {isAdmin && (
                    <CardActions sx={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', pr: 0.5, pt: 0, gap: 2, borderRadius: 0 }}>
                      <IconButton
                        onClick={() => {
                          setEntryToUndo(transaction);
                          setIsUndoReturnDialogOpen(true);
                        }}
                        sx={{ color: 'warning.main', mb: 0 }}
                      >
                        <UndoIcon />
                      </IconButton>
                      {isSuperAdmin && (
                        <IconButton
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsDeleteConfirmOpen(true);
                          }}
                          sx={{ color: 'error.main', mb: 0 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </CardActions>
                  )}
                </Card>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 3,
                mb: 2,
              }}
            >
              {filterTransactions(
                sortedTransactions.filter(transaction => transaction.status === 'Returned'),
                completedSearch
              ).map((transaction) => (
                <Card key={transaction.id} sx={{
                  borderRadius: 3,
                  boxShadow: 4,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.13),
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.09)}, #fff 80%)`,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  p: 1
                }}>
                  <CardContent sx={{ flex: 1, pr: 0, pb: 0.5, pt: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.05, fontSize: '1.15rem' }}>
                      {highlightText(transaction.details.name, completedSearch)}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.1, fontSize: '1.02rem' }}>
                      {highlightText(transaction.details.place, completedSearch)}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.02rem' }}>
                      {highlightText(transaction.details.phone, completedSearch)}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 500, mb: 0.3, fontSize: '1.18rem', letterSpacing: 0.2 }}>
                      {highlightText(transaction.issuedItems.join(', '), completedSearch)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.98rem', mb: 0.1, display: 'block' }}>
                      Care Of: {highlightText(transaction.inCareOf, completedSearch)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.98rem', display: 'block' }}>
                      Issued date: {formatDate(transaction.issueDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.98rem', display: 'block', fontWeight: 700 }}>
                      Returned: {formatDate(transaction.returnDate)}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Box
                        sx={{
                          bgcolor: 'success.main',
                          color: 'white',
                          px: 1,
                          py: 0.4,
                          borderRadius: 1,
                          display: 'inline-block',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        {transaction.status}
                      </Box>
                    </Box>
                  </CardContent>
                  {isAdmin && (
                    <CardActions sx={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', pr: 0.5, pt: 0, gap: 2, borderRadius: 0 }}>
                      <IconButton
                        onClick={() => {
                          setEntryToUndo(transaction);
                          setIsUndoReturnDialogOpen(true);
                        }}
                        sx={{ color: 'warning.main', mb: 0 }}
                      >
                        <UndoIcon />
                      </IconButton>
                      {isSuperAdmin && (
                        <IconButton
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsDeleteConfirmOpen(true);
                          }}
                          sx={{ color: 'error.main', mb: 0 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </CardActions>
                  )}
                </Card>
              ))}
            </Box>
          )
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)} 
        maxWidth="sm" 
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
          '& .MuiTypography-root': {
            fontSize: '1.5rem',
            fontWeight: 600,
          }
        }}>
          Edit Entry
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            fullWidth
            label="Place"
            value={formData.place}
            onChange={(e) => handleInputChange('place', e.target.value)}
            error={!!errors.place}
            helperText={errors.place}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone}
            margin="normal"
            required
            inputProps={{ maxLength: 10 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            fullWidth
            label="In Care Of"
            value={formData.inCareOf}
            onChange={(e) => handleInputChange('inCareOf', e.target.value)}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Select Items
            </Typography>
            {formData.selectedItems.map((selectedItem, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl 
                  fullWidth 
                  required 
                  error={!!errors.selectedItems}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                >
                  <InputLabel>Select Item</InputLabel>
                  <Select
                    value={selectedItem}
                    onChange={(e) => handleItemSelect(index, e.target.value)}
                    error={!!errors.selectedItems}
                    label="Select Item"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          borderRadius: 2,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }
                      }
                    }}
                  >
                    {items
                      .filter(item => item.available > 0 || item.name === selectedItem)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item) => (
                        <MenuItem 
                          key={item.id} 
                          value={item.name}
                          sx={{
                            py: 1.5,
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography>{item.name}</Typography>
                            <Typography color="text.secondary">
                              Available: {item.available}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                {index === 0 ? (
                  <IconButton 
                    onClick={addItemField}
                    sx={{ 
                      width: 40,
                      height: 40,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': { 
                        bgcolor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  >
                    <AddIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                ) : (
                  <IconButton 
                    onClick={() => removeItemField(index)}
                    sx={{ 
                      width: 40,
                      height: 40,
                      border: '1px solid',
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': { 
                        bgcolor: 'error.main',
                        color: 'white'
                      }
                    }}
                  >
                    <RemoveIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                )}
              </Box>
            ))}
            {errors.selectedItems && (
              <Typography color="error" variant="caption">
                {errors.selectedItems}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              label="Issue Date"
              type="date"
              value={formData.issueDate}
              onChange={(e) => handleInputChange('issueDate', e.target.value)}
              error={!!errors.issueDate}
              helperText={errors.issueDate}
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <Button
              variant="outlined"
              onClick={setTodayDate}
              sx={{ 
                minWidth: '100px',
                borderRadius: 2,
                height: '56px'
              }}
            >
              Today
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={() => setIsEditDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        maxWidth="sm" 
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
          '& .MuiTypography-root': {
            fontSize: '1.5rem',
            fontWeight: 600,
          }
        }}>
          Issue Item
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            fullWidth
            label="Place"
            value={formData.place}
            onChange={(e) => handleInputChange('place', e.target.value)}
            error={!!errors.place}
            helperText={errors.place}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone}
            margin="normal"
            required
            inputProps={{ maxLength: 10 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <TextField
            fullWidth
            label="In Care Of"
            value={formData.inCareOf}
            onChange={(e) => handleInputChange('inCareOf', e.target.value)}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Select Items
            </Typography>
            {formData.selectedItems.map((selectedItem, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl 
                  fullWidth 
                  required 
                  error={!!errors.selectedItems}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                >
                  <InputLabel>Select Item</InputLabel>
                  <Select
                    value={selectedItem}
                    onChange={(e) => handleItemSelect(index, e.target.value)}
                    error={!!errors.selectedItems}
                    label="Select Item"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          borderRadius: 2,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }
                      }
                    }}
                  >
                    {items
                      .filter(item => item.available > 0 || item.name === selectedItem)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item) => (
                        <MenuItem 
                          key={item.id} 
                          value={item.name}
                          sx={{
                            py: 1.5,
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography>{item.name}</Typography>
                            <Typography color="text.secondary">
                              Available: {item.available}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                {index === 0 ? (
                  <IconButton 
                    onClick={addItemField}
                    sx={{ 
                      width: 40,
                      height: 40,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': { 
                        bgcolor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  >
                    <AddIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                ) : (
                  <IconButton 
                    onClick={() => removeItemField(index)}
                    sx={{ 
                      width: 40,
                      height: 40,
                      border: '1px solid',
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': { 
                        bgcolor: 'error.main',
                        color: 'white'
                      }
                    }}
                  >
                    <RemoveIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                )}
              </Box>
            ))}
            {errors.selectedItems && (
              <Typography color="error" variant="caption">
                {errors.selectedItems}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              label="Issue Date"
              type="date"
              value={formData.issueDate}
              onChange={(e) => handleInputChange('issueDate', e.target.value)}
              error={!!errors.issueDate}
              helperText={errors.issueDate}
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <Button
              variant="outlined"
              onClick={setTodayDate}
              sx={{ 
                minWidth: '100px',
                borderRadius: 2,
                height: '56px'
              }}
            >
              Today
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={() => setIsAddDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={resetForm}
            sx={{ borderRadius: 2 }}
          >
            Clear Form
          </Button>
          <Button 
            onClick={handleAddTransaction} 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Enter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog 
        open={isReturnDialogOpen} 
        onClose={() => setIsReturnDialogOpen(false)} 
        maxWidth="sm" 
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
          '& .MuiTypography-root': {
            fontSize: '1.5rem',
            fontWeight: 600,
          }
        }}>
          Return Item
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedTransaction && (
            <>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 2,
                mb: 3,
                border: '1px solid #eee'
              }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Transaction Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Name: {selectedTransaction.details.name}<br />
                  Place: {selectedTransaction.details.place}<br />
                  Phone: {selectedTransaction.details.phone}
                </Typography>
              </Box>

              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 2,
                mb: 3,
                border: '1px solid #eee'
              }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Item Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Items to Return: {selectedTransaction.issuedItems.join(', ')}
                </Typography>
              </Box>

              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 2,
                border: '1px solid #eee'
              }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Return Details
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Return Date"
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    required
                    error={!formData.returnDate}
                    helperText={!formData.returnDate ? 'Return date is required' : ''}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: new Date().toISOString().split('T')[0] }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      returnDate: new Date().toISOString().split('T')[0]
                    }))}
                    sx={{ 
                      minWidth: '100px',
                      borderRadius: 2,
                      height: '56px'
                    }}
                  >
                    Today
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={() => setIsReturnDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReturnItems} 
            variant="contained"
            disabled={!formData.returnDate}
            sx={{ borderRadius: 2 }}
          >
            Mark as Returned
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)}
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
          '& .MuiTypography-root': {
            fontSize: '1.5rem',
            fontWeight: 600,
          }
        }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography>
            Are you sure you want to delete this entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={() => setIsDeleteConfirmOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteTransaction} 
            color="error" 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Undo Return Dialog */}
      <Dialog open={isUndoReturnDialogOpen} onClose={() => setIsUndoReturnDialogOpen(false)}>
        <DialogTitle>Undo Return</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to undo the return of {entryToUndo?.issuedItems[0]}?
            This will mark the item as issued again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUndoReturnDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => entryToUndo && handleUndoReturn(entryToUndo)} 
            color="warning"
            variant="contained"
          >
            Undo Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* Show Add FAB for both admin types */}
      {isAdmin && (
        <Button
          variant="contained"
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            width: 56,
            height: 56,
            borderRadius: '50%',
            minWidth: 0,
            padding: 0,
            zIndex: 1000,
            background: 'linear-gradient(90deg, #3758cd 0%, #c5006b 100%)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(55,88,205,0.13)',
            fontWeight: 700,
            '&:hover': {
              background: 'linear-gradient(90deg, #c5006b 0%, #3758cd 100%)',
            },
          }}
          onClick={() => {
            setIsAddDialogOpen(true);
            resetForm();
          }}
        >
          <AddIcon />
        </Button>
      )}
    </Box>
  );
};

export default Register; 