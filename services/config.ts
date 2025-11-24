
// Determine API base URL based on environment
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
    ? 'http://localhost:3001/api'
    : '/.netlify/functions';

export const WEBHOOK_CONFIG = {
    API_BASE_URL,
    GET_ORDERS_URL: `${API_BASE_URL}/orders`,
    CREATE_ORDER_URL: `${API_BASE_URL}/orders`,
    UPDATE_ORDER_URL: isDevelopment 
        ? `${API_BASE_URL}/orders/update-status`
        : `${API_BASE_URL}/orders-update`,
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
    AUTO_REFRESH_INTERVAL_MS: 10000, // 10 seconds
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// The application will only show orders for this Restaurant ID (Legacy/Default)
export const TARGET_RESTAURANT_ID = 3;
