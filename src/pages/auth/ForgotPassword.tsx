import React, { useState, useEffect } from 'react';
import { Button, TextField, IconButton, InputAdornment, Typography, Box, Container } from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Box)(() => ({
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '48px 40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    maxWidth: '440px',
    width: '100%',
    margin: '0 auto',
}));

const StyledTextField = styled(TextField)(() => ({
    marginBottom: '24px',
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: '#f8f9fa',
        '& fieldset': {
            borderColor: '#e0e0e0',
        },
        '&:hover fieldset': {
            borderColor: '#f97316',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#f97316',
        },
    },
    '& .MuiInputLabel-root': {
        color: '#6b7280',
        '&.Mui-focused': {
            color: '#f97316',
        },
    },
}));

const CodeInput = styled('input')(() => ({
    width: '56px',
    height: '56px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: '600',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    transition: 'all 0.3s ease',
    '&:focus': {
        borderColor: '#f97316',
        backgroundColor: 'white',
        boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.1)',
    },
    '&:not(:placeholder-shown)': {
        borderColor: '#f97316',
        backgroundColor: 'white',
    },
}));

const StyledButton = styled(Button)(() => ({
    backgroundColor: '#f97316',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
    '&:hover': {
        backgroundColor: '#ea580c',
        boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
        transform: 'translateY(-1px)',
    },
    '&:active': {
        transform: 'translateY(0)',
    },
}));

const CountdownText = styled(Typography)(() => ({
    color: '#f97316',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '24px',
}));

const BrandTitle = styled(Typography)(() => ({
    color: '#f97316',
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '24px',
    letterSpacing: '2px',
}));

const ForgotPassword: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    const [email, setEmail] = useState<string>('');
    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(30);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if ((step === 2 || step === 3) && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown, step]);

    const handleNextStep = () => {
        if (step < 6) setStep(step + 1);
    };

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
        if (pasted.length === code.length) {
            const newCode = pasted.split('').slice(0, code.length);
            setCode(newCode);
            const nextInput = document.getElementById(`code-${newCode.length - 1}`);
            nextInput?.focus();
        }
    };


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    const isValidEmail = /\S+@\S+\.\S+/.test(email); // Regex kiểm tra định dạng email
    const isCodeValid = code.every((digit) => digit.trim() !== '');

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <StyledCard>
                        <BrandTitle>GEOPHY</BrandTitle>
                        <Typography variant="h4" className="font-bold mb-3" sx={{ color: '#1f2937', fontSize: '28px' }}>
                            Quên mật khẩu
                        </Typography>
                        <Typography variant="body1" className="mb-8 text-gray-600" sx={{ fontSize: '16px', lineHeight: 1.6 }}>
                            Nhập email của bạn để xác minh, chúng tôi sẽ gửi mã gồm 6 chữ số đến email của bạn.
                        </Typography>
                        <StyledTextField
                            label="Email"
                            variant="outlined"
                            type="email"
                            required
                            autoComplete="email"
                            fullWidth
                            className='mt-3'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nguyenhuuhieu@gmail.com"
                            error={email !== '' && !isValidEmail}
                            helperText={email !== '' && !isValidEmail ? 'Email không hợp lệ' : ' '}
                        />

                        <StyledButton
                            variant="contained"
                            fullWidth
                            onClick={handleNextStep}
                            sx={{ mt: -2 }}
                            disabled={!isValidEmail}
                        >
                            TIẾP TỤC
                        </StyledButton>

                    </StyledCard>
                );

            case 2:
            case 3:
                return (
                    <StyledCard>
                        <Typography variant="h4" className="font-bold mb-3 text-center" sx={{ color: '#f97316', fontSize: '28px' }}>
                            Xác nhận mã
                        </Typography>
                        <Typography variant="body1" className="mb-8 text-center text-gray-600" sx={{ fontSize: '16px', lineHeight: 1.6 }}>
                            Nhập mã gồm 6 chữ số mà bạn nhận được qua email.
                        </Typography>

                        <Box className="flex justify-center gap-3 mb-6">
                            {code.map((digit, idx) => (
                                <CodeInput
                                    key={idx}
                                    id={`code-${idx}`}
                                    type="text"
                                    className="text-center text-black font-bold"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    required
                                    autoFocus={idx === 0}
                                    onChange={(e) =>
                                        handleCodeChange(idx, e.target.value.replace(/[^0-9]/g, ''))
                                    }
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    onPaste={idx === 0 ? handlePaste : undefined}
                                />
                            ))}
                        </Box>


                        <Box className="text-center mt-2">
                            <CountdownText>{formatTime(countdown)}</CountdownText>
                            <StyledButton
                                fullWidth
                                variant="contained"
                                onClick={handleNextStep}
                                disabled={!isCodeValid} 
                                sx={{ mb: 2, backgroundColor: isCodeValid ? '#f97316' : '#e5e7eb', color: isCodeValid ? 'white' : '#6b7280' }}
                            >
                                {step === 2 ? 'TIẾP TỤC' : 'XÁC NHẬN'}
                            </StyledButton>
                            <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                Nếu bạn không nhận được mã!{' '}
                                <Button
                                    sx={{
                                        color: '#ef4444',
                                        textDecoration: 'underline',
                                        p: 0,
                                        minWidth: 'auto',
                                        textTransform: 'none'
                                    }}
                                    onClick={() => {
                                        setCountdown(30);
                                        alert('Gửi lại mã');
                                    }}
                                >
                                    Gửi lại
                                </Button>
                            </Typography>
                        </Box>
                    </StyledCard>
                );

            case 4:
            case 5:
                return (
                    <StyledCard>
                        <BrandTitle>GEOPHY</BrandTitle>
                        <Typography variant="h4" className="font-bold mb-3" sx={{ color: '#1f2937', fontSize: '28px' }}>
                            Mật khẩu mới
                        </Typography>
                        <Typography variant="body1" className="mb-8 text-gray-600" sx={{ fontSize: '16px', lineHeight: 1.6 }}>
                            Đặt mật khẩu mới cho tài khoản của bạn để bạn có thể đăng nhập và truy cập tất cả các tính năng.
                        </Typography>

                        <StyledTextField
                            label="Nhập mật khẩu mới"
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            aria-label="toggle password visibility"
                                            sx={{ color: '#6b7280' }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <StyledTextField
                            label="Nhập lại mật khẩu mới"
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            aria-label="toggle password visibility"
                                            sx={{ color: '#6b7280' }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <StyledButton
                            variant="contained"
                            fullWidth
                            onClick={handleNextStep}
                            sx={{ mt: 2 }}
                        >
                            CẬP NHẬT MẬT KHẨU
                        </StyledButton>
                    </StyledCard>
                );

            case 6:
                return (
                    <StyledCard>
                        <Box className="text-center">
                            <Box className="mb-8">
                                <CheckCircle
                                    sx={{
                                        fontSize: '80px',
                                        color: '#f97316',
                                        filter: 'drop-shadow(0 4px 12px rgba(249, 115, 22, 0.3))'
                                    }}
                                />
                            </Box>
                            <Typography variant="h4" className="font-bold mb-4" sx={{ color: '#1f2937', fontSize: '28px' }}>
                                Thành công
                            </Typography>
                            <Typography variant="body1" className="mb-8 text-gray-600" sx={{ fontSize: '16px', lineHeight: 1.6 }}>
                                Mật khẩu của bạn đã được làm mới thành công
                            </Typography>
                            <StyledButton
                                variant="contained"
                                fullWidth
                                onClick={() => alert('Tiếp tục')}
                            >
                                TIẾP TỤC
                            </StyledButton>
                        </Box>
                    </StyledCard>
                );

            default:
                return null;
        }
    };

    return (
        <Box
            className="min-h-screen flex items-center justify-center p-4"
            sx={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            }}
        >
            <Container maxWidth="sm">
                {renderStepContent()}
            </Container>
        </Box>
    );
};

export default ForgotPassword;