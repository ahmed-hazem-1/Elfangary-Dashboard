
// Determine API base URL based on environment
// In production (Netlify), window.location.hostname will NOT be 'localhost'
// In development, it will be 'localhost'
const isDevelopment = typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : import.meta.env.DEV;

const API_BASE_URL = isDevelopment 
    ? 'http://localhost:3001/api'
    : '/api';

console.log('[Config] isDevelopment:', isDevelopment, 'API_BASE_URL:', API_BASE_URL);

export const WEBHOOK_CONFIG = {
    API_BASE_URL,
    GET_ORDERS_URL: `${API_BASE_URL}/orders`,
    CREATE_ORDER_URL: `${API_BASE_URL}/orders`,
    UPDATE_ORDER_URL: isDevelopment 
        ? `${API_BASE_URL}/orders/update-status`
        : `${API_BASE_URL}/orders-update`,
    FIX_TOTALS_URL: `${API_BASE_URL}/fix-totals`,
    GET_MENU_URL: `${API_BASE_URL}/menu`,
    TOGGLE_MENU_URL: isDevelopment 
        ? `${API_BASE_URL}/menu/toggle`
        : `${API_BASE_URL}/menu-toggle`,
    UPDATE_MENU_URL: isDevelopment 
        ? `${API_BASE_URL}/menu/update`
        : `${API_BASE_URL}/menu-update`,
    ADD_MENU_URL: isDevelopment 
        ? `${API_BASE_URL}/menu/add`
        : `${API_BASE_URL}/menu-add`,
    DELETE_MENU_URL: isDevelopment 
        ? `${API_BASE_URL}/menu/delete`
        : `${API_BASE_URL}/menu-delete`,
    AUTO_REFRESH_INTERVAL_MS: 10000, // 10 seconds
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// The application will only show orders for this Restaurant ID (Legacy/Default)
export const TARGET_RESTAURANT_ID = 3;
