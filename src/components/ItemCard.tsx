import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CardMedia,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OutboundIcon from '@mui/icons-material/Outbound';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Item } from '../types';

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  // Calculate available on the fly
  const available = item.total - item.issued;
  return (
    <Card
      // Removed onClick for editing
      sx={{
        cursor: 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px) scale(1.03)',
          boxShadow: 8,
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(67, 206, 162, 0.10)',
        background: 'white',
      }}
    >
      <Box
        sx={{
          width: '100%',
          aspectRatio: '1/1', // 1:1 ratio
          maxHeight: 220,
          background: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          mt: 1,
          mb: 1,
        }}
      >
        <CardMedia
          component="img"
          image={item.imageUrl}
          alt={item.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(55,88,205,0.08)',
            background: 'white',
            maxWidth: 220,
            maxHeight: 220,
          }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            mb: 2,
            fontWeight: 800,
            color: 'primary.main',
            fontFamily: 'Montserrat, Roboto, sans-serif',
            letterSpacing: 0.5,
          }}
        >
          {item.name}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1, // Reduced gap between chips
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1,
            userSelect: 'none',
          }}
        >
          {/* Stat chips are not clickable */}
          <Tooltip title="Issued" arrow>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.2,
                py: 0.7,
                borderRadius: 2,
                background: '#c5006b',
                color: 'white',
                minWidth: 60,
                boxShadow: '0 1px 4px rgba(197,0,107,0.10)',
                pointerEvents: 'none',
                flexDirection: 'column',
              }}
            >
              <OutboundIcon sx={{ color: 'white', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 900, textAlign: 'center', width: '100%', fontSize: '1.7rem', lineHeight: 1 }}>
                {item.issued}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500, textAlign: 'center', width: '100%' }}>
                Issued
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Total" arrow>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.2,
                py: 0.7,
                borderRadius: 2,
                background: '#3758cd',
                color: 'white',
                minWidth: 60,
                boxShadow: '0 1px 4px rgba(55,88,205,0.10)',
                pointerEvents: 'none',
                flexDirection: 'column',
              }}
            >
              <Inventory2Icon sx={{ color: 'white', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 900, textAlign: 'center', width: '100%', fontSize: '1.7rem', lineHeight: 1 }}>
                {item.total}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500, textAlign: 'center', width: '100%' }}>
                Total
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Available" arrow>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.2,
                py: 0.7,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #43cea2 0%, #2ecc40 100%)',
                color: 'white',
                minWidth: 60,
                boxShadow: '0 1px 4px rgba(67,206,162,0.10)',
                pointerEvents: 'none',
                flexDirection: 'column',
              }}
            >
              <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 900, textAlign: 'center', width: '100%', fontSize: '1.7rem', lineHeight: 1 }}>
                {available}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500, textAlign: 'center', width: '100%' }}>
                Available
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ItemCard; 