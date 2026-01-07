import React from 'react';
import MuiCard, { CardProps as MuiCardProps } from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import { Box, Typography } from '@mui/material';

export interface CardProps extends MuiCardProps {
  variant?: 'elevation' | 'outlined';
}

export function Card({ variant = 'elevation', sx, ...props }: CardProps) {
  return (
    <MuiCard 
      variant={variant}
      sx={{ 
        backgroundColor: 'background.paper',
        ...sx 
      }} 
      {...props} 
    />
  );
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Typography variant="h6" component="h3" className={className}>
      {children}
    </Typography>
  );
}

export interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <Typography variant="body2" color="text.secondary" className={className}>
      {children}
    </Typography>
  );
}

export { CardHeader, CardContent, CardActions, CardMedia };
export { MuiCard as CardRoot };
