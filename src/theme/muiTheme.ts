import { createTheme, ThemeOptions } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: 'hsl(199, 89%, 48%)',
            contrastText: '#ffffff',
          },
          secondary: {
            main: 'hsl(210, 40%, 96%)',
            contrastText: 'hsl(222, 47%, 11%)',
          },
          error: {
            main: 'hsl(0, 84%, 60%)',
            contrastText: '#ffffff',
          },
          warning: {
            main: 'hsl(38, 92%, 50%)',
            contrastText: '#ffffff',
          },
          success: {
            main: 'hsl(142, 71%, 45%)',
            contrastText: '#ffffff',
          },
          info: {
            main: 'hsl(199, 89%, 48%)',
            contrastText: '#ffffff',
          },
          background: {
            default: 'hsl(210, 20%, 98%)',
            paper: '#ffffff',
          },
          text: {
            primary: 'hsl(222, 47%, 11%)',
            secondary: 'hsl(215, 16%, 47%)',
          },
          divider: 'hsl(214, 32%, 91%)',
        }
      : {
          primary: {
            main: 'hsl(199, 89%, 55%)',
            contrastText: 'hsl(224, 71%, 4%)',
          },
          secondary: {
            main: 'hsl(215, 28%, 17%)',
            contrastText: 'hsl(210, 40%, 98%)',
          },
          error: {
            main: 'hsl(0, 62%, 45%)',
            contrastText: '#ffffff',
          },
          warning: {
            main: 'hsl(38, 92%, 50%)',
            contrastText: '#ffffff',
          },
          success: {
            main: 'hsl(142, 71%, 45%)',
            contrastText: '#ffffff',
          },
          info: {
            main: 'hsl(199, 89%, 55%)',
            contrastText: '#ffffff',
          },
          background: {
            default: 'hsl(224, 71%, 4%)',
            paper: 'hsl(224, 71%, 6%)',
          },
          text: {
            primary: 'hsl(210, 40%, 98%)',
            secondary: 'hsl(217, 10%, 64%)',
          },
          divider: 'hsl(215, 28%, 17%)',
        }),
  },
  typography: {
    fontFamily: "'Inter', 'system-ui', 'sans-serif'",
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500,
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '10px 24px',
          fontSize: '0.9375rem',
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 40,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          margin: '2px 4px',
          padding: '8px 12px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 44,
          height: 24,
          padding: 0,
        },
        switchBase: {
          padding: 2,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
          },
        },
        thumb: {
          width: 20,
          height: 20,
        },
        track: {
          borderRadius: 12,
        },
      },
    },
  },
});

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));

export default lightTheme;
