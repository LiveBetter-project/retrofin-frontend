import { createTheme } from '@mui/material/styles';

const BRAND = {
  primaryDark: '#353535',
  pink: '#F03157',
  green: '#278A21',
  sand: '#ECC896',
  white: '#FFFFFF',
};

const SURFACE = {
  backgroundDefault: '#F7F4EF',
  backgroundPaper: '#FFFFFF',
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
      default: SURFACE.backgroundDefault,
      paper: SURFACE.backgroundPaper,
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
        html: {
          backgroundColor: SURFACE.backgroundDefault,
        },
        body: {
          backgroundColor: SURFACE.backgroundDefault,
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