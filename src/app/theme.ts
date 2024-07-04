'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    // You can customize your theme here
    //dark theme
    palette: {
        mode: 'dark',
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    marginBottom: '16px',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    padding: '16px',
                },
            },
        },
        MuiList: {
            styleOverrides: {
                root: {
                    marginBottom: '16px',
                },
            },
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    padding: '8px 0',
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    marginBottom: '16px',
                },
            },
        },
    },
    
});

export default theme;