import { createTheme } from '@mui/material/styles';

const BRAND = {
  primaryDark: '#353535',   // P–01
  pink: '#F03157',          // S–01
  green: '#61EF59',         // S–02
  sand: '#ECC896',          // S–03
  white: '#FFFFFF',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BRAND.primaryDark,
    },
    secondary: {
      main: BRAND.pink,
    },
    success: {
      main: BRAND.green,
    },
    warning: {
      main: BRAND.sand,
    },
    error: {
      main: BRAND.pink,
    },
    background: {
      default: BRAND.white,
      paper: BRAND.white,
    },
    text: {
      primary: BRAND.primaryDark,
      secondary: 'rgba(53, 53, 53, 0.72)',
    },
    divider: 'rgba(53, 53, 53, 0.12)',
  },

  typography: {
    fontFamily:
      '"Manrope",-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightSemiBold: 600,
    fontWeightBold: 700,
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BRAND.white,
          color: BRAND.primaryDark,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;