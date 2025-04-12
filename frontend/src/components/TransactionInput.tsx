import React from 'react';
import {
    Button,
    TextField,
    Box,
    Paper,
    Typography,
    Container,
} from '@mui/material';

interface TransactionInputProps {
    value: string;
    error: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

export default function TransactionInput(input: TransactionInputProps) {
    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '98vh',
                    justifyContent: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: '100%',
                        maxWidth: 500,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    }}
                >
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom
                        sx={{
                            textAlign: 'center',
                            color: 'primary.main',
                            mb: 3
                        }}
                    >
                        Enter Transaction ID:
                    </Typography>

                    <TextField
                        label="Transaction ID"
                        variant="outlined"
                        fullWidth
                        value={input.value}
                        onChange={(e) => input.onChange(e.target.value)}
                        onKeyUp={(event) => {
                            if (event.key == 'Enter') {
                                input.onSubmit()
                            }
                        }}
                        error={!!input.error}
                        helperText={input.error}
                        sx={{ mb: 3 }}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        onClick={input.onSubmit}
                        sx={{
                            py: 1.5,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            boxShadow: '0px 4px 10px rgba(25, 118, 210, 0.3)',
                            '&:hover': {
                                boxShadow: '0px 6px 15px rgba(25, 118, 210, 0.4)',
                            }
                        }}
                    >
                        Go!
                    </Button>
                </Paper>
            </Box>
        </Container>
    );
};
