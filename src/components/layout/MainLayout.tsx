import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Science as ScienceIcon,
  Folder as FolderIcon,
  MenuBook as MenuBookIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Assignment as AssignmentIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from 'notistack';

const drawerWidth = 280;

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Заявки на испытания', icon: <DescriptionIcon />, path: '/applications' },
  { text: 'Планы испытаний', icon: <AssignmentIcon />, path: '/trial-plans' },
  { text: 'Испытания по областям', icon: <ScienceIcon />, path: '/trials' },
  { text: 'Годовой отчет', icon: <TableChartIcon />, path: '/methodology' },
  { text: 'Реестр селекционных достижений', icon: <FolderIcon />, path: '/sort-records' },
  { text: 'Справочники', icon: <MenuBookIcon />, path: '/dictionaries' },
];

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
      enqueueSnackbar('Вы вышли из системы', { variant: 'info' });
      navigate('/login');
    } catch (error) {
      enqueueSnackbar('Ошибка при выходе', { variant: 'error' });
    }
  };

  const handleNavigation = (path: string) => {
    // Don't navigate if already on the same path (preserves query params)
    const isCurrentPath = path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

    if (!isCurrentPath) {
      navigate(path);
    }

    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap>
          Trials Service
        </Typography>
        {!isMobile && desktopOpen && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />

      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname.startsWith(item.path) ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          width: { 
            xs: '100%', 
            md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' 
          },
          ml: { 
            xs: 0, 
            md: desktopOpen ? `${drawerWidth}px` : 0 
          },
          bgcolor: 'white',
          color: 'text.primary',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
        elevation={1}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Система сортоиспытаний
          </Typography>

          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={500}>
                {user?.full_name || user?.username}
              </Typography>
              {user?.is_staff && (
                <Chip label="Admin" size="small" color="primary" sx={{ height: 18 }} />
              )}
            </Box>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={user?.username} secondary={user?.email} />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Выйти" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        open={desktopOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: desktopOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: { xs: 2, sm: 3 },
          minHeight: '100vh',
          width: {
            xs: '100%',
            md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%',
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
