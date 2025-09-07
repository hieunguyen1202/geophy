import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

interface SelectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
}

const SelectModal: React.FC<SelectModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  options,
  initialValue = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const [selectedValue, setSelectedValue] = React.useState(initialValue);

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedValue(event.target.value);
  };

  const handleConfirm = () => {
    onConfirm(selectedValue);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="select-label">Select Option</InputLabel>
          <Select
            labelId="select-label"
            value={selectedValue}
            label="Select Option"
            onChange={handleChange}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectModal; 