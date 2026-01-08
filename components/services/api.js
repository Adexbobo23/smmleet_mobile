import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/apiUrls';

// Storage keys
const AUTH_TOKEN_KEY = '@smmleet_auth_token';
const USER_DATA_KEY = '@smmleet_user_data';
const SESSION_KEY = '@smmleet_session';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ============ TOKEN/SESSION MANAGEMENT ============
  async saveAuthData(token, userData, walletBalance = '0.00') {
    try {
      const authData = {
        user: userData,
        wallet_balance: walletBalance,
        logged_in_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token); // Store actual token
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(authData));
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ active: true }));
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  }

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getUserData() {
    try {
      const data = await AsyncStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async getUser() {
    try {
      const authData = await this.getUserData();
      return authData?.user || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async saveUser(user) {
    try {
      const authData = await this.getUserData();
      if (authData) {
        authData.user = user;
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(authData));
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY, SESSION_KEY]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      const userData = await this.getUserData();
      return !!(token && userData?.user);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // ============ GENERIC API REQUEST ============
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Get auth token and add to headers if available
    const token = await this.getAuthToken();
    if (token) {
      defaultHeaders['Authorization'] = `Token ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      console.log(`API Response (${response.status}):`, JSON.stringify(data).substring(0, 200));

      // Handle 401 Unauthorized
      if (response.status === 401) {
        await this.clearAuthData();
        throw new Error('Session expired. Please login again.');
      }

      // Handle error responses
      if (!response.ok) {
        // Extract error message from various formats
        let errorMessage = 'Request failed';
        
        if (data.error) {
          errorMessage = data.error;
        } else if (data.errors) {
          if (typeof data.errors === 'object') {
            errorMessage = Object.values(data.errors).flat().join(', ');
          } else {
            errorMessage = data.errors;
          }
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = data.non_field_errors.join(', ');
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ============ AUTH ENDPOINTS ============
  
  /**
   * Register a new user
   * POST /auth/register/
   * Body: { username, email, password, password_confirm, first_name, last_name }
   * Returns: { success: true, message, token, user, wallet_balance }
   */
  async register(userData) {
    const data = await this.post('auth/register/', {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      password_confirm: userData.password_confirm || userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name,
    });

    if (data.success && data.token && data.user) {
      await this.saveAuthData(data.token, data.user, data.wallet_balance);
    }

    return data;
  }

  /**
   * Login user
   * POST /auth/login/
   * Body: { username, password } - username can be email or username
   * Returns: { success: true, token, user, wallet_balance }
   */
  async login(credentials) {
    const data = await this.post('auth/login/', {
      username: credentials.username,
      password: credentials.password,
    });

    if (data.success && data.token && data.user) {
      await this.saveAuthData(data.token, data.user, data.wallet_balance);
    }

    return data;
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Try to call logout endpoint if exists
      await this.post('auth/logout/', {}).catch(() => {});
    } catch (error) {
      // Ignore logout API errors
    }
    await this.clearAuthData();
  }

  /**
   * Request password reset OTP
   * POST /auth/password-reset/
   * Body: { email }
   */
  async requestPasswordReset(email) {
    return this.post('auth/password-reset/', { email });
  }

  /**
   * Verify password reset OTP
   * POST /auth/password-reset/verify/
   * Body: { email, otp }
   */
  async verifyPasswordResetOTP(email, otp) {
    return this.post('auth/password-reset/verify/', { email, otp });
  }

  /**
   * Confirm password reset with new password
   * POST /auth/password-reset/confirm/
   * Body: { email, otp, new_password, confirm_password }
   */
  async confirmPasswordReset(email, otp, newPassword, confirmPassword) {
    return this.post('auth/password-reset/confirm/', {
      email,
      otp,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  }

  /**
   * Resend password reset OTP
   * POST /auth/password-reset/resend/
   * Body: { email }
   */
  async resendPasswordResetOTP(email) {
    return this.post('auth/password-reset/resend/', { email });
  }

  // ============ USER ENDPOINTS ============

  /**
   * Get user profile
   * GET /user/profile/
   * Returns: user object with wallet_balance
   */
  async getUserProfile() {
    return this.get('user/profile/');
  }

  /**
   * Update user profile
   * PUT/PATCH /user/profile/update/
   * Body: { first_name, last_name, email }
   */
  async updateProfile(profileData) {
    const data = await this.patch('user/profile/update/', profileData);
    
    // Update stored user data
    if (data && data.success) {
      const currentUser = await this.getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...profileData };
        await this.saveUser(updatedUser);
      }
    }
    
    return data;
  }

  /**
   * Change password
   * POST /user/change-password/
   * Body: { old_password, new_password, confirm_password }
   */
  async changePassword(oldPassword, newPassword, confirmPassword) {
    return this.post('user/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  }

  // ============ DASHBOARD ENDPOINTS ============

  /**
   * Get dashboard statistics
   * GET /dashboard/stats/
   * Returns: { total_orders, pending_orders, processing_orders, completed_orders, 
   *            failed_orders, cancelled_orders, total_spent, wallet_balance, order_stats }
   */
  async getDashboardStats() {
    return this.get('dashboard/stats/');
  }

  // ============ CATEGORIES ENDPOINTS ============

  /**
   * Get all categories
   * GET /categories/
   * Returns: paginated list of categories with service_count
   */
  async getCategories() {
    return this.get('categories/');
  }

  // ============ SERVICES ENDPOINTS ============

  /**
   * Get all services (paginated)
   * GET /services/
   * Query params: category, featured, search, page, page_size
   */
  async getServices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`services/${query ? '?' + query : ''}`);
  }

  /**
   * Get services by category
   * GET /services/by-category/?category_id=X
   */
  async getServicesByCategory(categoryId) {
    return this.get(`services/by-category/?category_id=${categoryId}`);
  }

  /**
   * Get all services list
   * GET /services/list/
   */
  async getServicesList() {
    return this.get('services/list/');
  }

  /**
   * Get popular services
   * GET /services/popular/
   */
  async getPopularServices() {
    return this.get('services/popular/');
  }

  /**
   * Get featured services
   * GET /services/featured/
   */
  async getFeaturedServices() {
    return this.get('services/featured/');
  }

  // ============ ORDERS ENDPOINTS ============

  /**
   * Get user orders
   * GET /orders/
   * Query params: status, search, page, page_size
   */
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`orders/${query ? '?' + query : ''}`);
  }

  /**
   * Create new order
   * POST /orders/create/
   * Body: { service_id, link, quantity, custom_comments?, usernames?, runs?, interval? }
   * Returns: { success: true, order_id, display_id, charge, new_balance }
   */
  async createOrder(orderData) {
    return this.post('orders/create/', {
      service_id: orderData.service_id || orderData.service,
      link: orderData.link,
      quantity: orderData.quantity,
      custom_comments: orderData.custom_comments,
      usernames: orderData.usernames,
      runs: orderData.runs,
      interval: orderData.interval,
    });
  }

  /**
   * Get order status
   * GET /orders/{order_id}/status/
   */
  async getOrderStatus(orderId) {
    return this.get(`orders/${orderId}/status/`);
  }

  /**
   * Get order statistics
   * GET /orders/stats/
   */
  async getOrderStats() {
    return this.get('orders/stats/');
  }

  // ============ MASS ORDERS ENDPOINTS ============

  /**
   * Validate mass orders text
   * POST /mass-orders/validate/
   * Body: { orders_text }
   */
  async validateMassOrders(ordersText) {
    return this.post('mass-orders/validate/', { orders_text: ordersText });
  }

  /**
   * Create mass orders batch
   * POST /mass-orders/create/
   * Body: { orders_text } - Format: "service_id|link|quantity" per line, max 500
   */
  async createMassOrder(ordersText) {
    return this.post('mass-orders/create/', { orders_text: ordersText });
  }

  /**
   * Get mass order batch status
   * GET /mass-orders/{batch_id}/status/
   */
  async getMassOrderStatus(batchId) {
    return this.get(`mass-orders/${batchId}/status/`);
  }

  /**
   * Get mass order batch details
   * GET /mass-orders/{batch_id}/
   */
  async getMassOrderDetails(batchId) {
    return this.get(`mass-orders/${batchId}/`);
  }

  // ============ WALLET ENDPOINTS ============

  /**
   * Get wallet balance
   * GET /wallet/balance/
   * Returns: { balance, formatted_balance }
   */
  async getWalletBalance() {
    return this.get('wallet/balance/');
  }

  /**
   * Get wallet summary
   * GET /wallet/summary/
   * Returns: { balance, total_deposits, total_spent, recent_transactions }
   */
  async getWalletSummary() {
    return this.get('wallet/summary/');
  }

  /**
   * Get transaction history
   * GET /wallet/transactions/
   * Query params: type, limit
   */
  async getTransactions(type = null, limit = 50) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit.toString());
    return this.get(`wallet/transactions/?${params.toString()}`);
  }

  /**
   * Get crypto addresses
   * GET /wallet/addresses/
   */
  async getCryptoAddresses() {
    return this.get('wallet/addresses/');
  }

  /**
   * Create static crypto address
   * POST /wallet/addresses/create/
   * Body: { currency, network }
   */
  async createCryptoAddress(currency = 'USDT', network = 'tron') {
    return this.post('wallet/addresses/create/', { currency, network });
  }

  /**
   * Get withdrawal requests
   * GET /wallet/withdrawals/
   */
  async getWithdrawals() {
    return this.get('wallet/withdrawals/');
  }

  /**
   * Create withdrawal request
   * POST /wallet/withdrawals/create/
   * Body: { amount, crypto_currency, network, recipient_address }
   */
  async createWithdrawal(withdrawalData) {
    return this.post('wallet/withdrawals/create/', {
      amount: withdrawalData.amount,
      crypto_currency: withdrawalData.crypto_currency,
      network: withdrawalData.network,
      recipient_address: withdrawalData.recipient_address,
    });
  }

  // ============ PAYMENT ENDPOINTS ============

  /**
   * Calculate deposit bonus
   * POST /payments/calculate-bonus/
   * Body: { amount }
   * Returns: { bonus_percentage, bonus_amount, total_amount }
   */
  async calculateBonus(amount) {
    return this.post('payments/calculate-bonus/', { amount: parseFloat(amount) });
  }

  /**
   * Create payment
   * POST /payments/create/
   * Body: { amount, payment_method, currency, network }
   * payment_method: 'invoice' or 'static'
   * Returns: { success, order_id, payment_url?, address?, currency?, network? }
   */
  async createPayment(paymentData) {
    return this.post('payments/create/', {
      amount: parseFloat(paymentData.amount),
      payment_method: paymentData.payment_method,
      currency: paymentData.currency || 'USDT',
      network: paymentData.network || 'tron',
    });
  }

  /**
   * Get payment status
   * GET /payments/{order_id}/status/
   */
  async getPaymentStatus(orderId) {
    return this.get(`payments/${orderId}/status/`);
  }

  // ============ SUPPORT ENDPOINTS ============

  /**
   * Get support tickets
   * GET /tickets/
   */
  async getTickets() {
    return this.get('tickets/');
  }

  /**
   * Create support ticket
   * POST /tickets/
   * Body: { subject, order_id?, priority?, initial_message }
   */
  async createTicket(ticketData) {
    return this.post('tickets/', {
      subject: ticketData.subject,
      order_id: ticketData.order_id,
      priority: ticketData.priority || 'medium',
      initial_message: ticketData.message || ticketData.initial_message,
    });
  }

  /**
   * Get ticket details
   * GET /tickets/{id}/
   */
  async getTicketDetails(ticketId) {
    return this.get(`tickets/${ticketId}/`);
  }

  /**
   * Add message to ticket
   * POST /tickets/{id}/add_message/
   * Body: { message }
   */
  async addTicketMessage(ticketId, message) {
    return this.post(`tickets/${ticketId}/add_message/`, { message });
  }

  /**
   * Close ticket
   * POST /tickets/{id}/close/
   */
  async closeTicket(ticketId) {
    return this.post(`tickets/${ticketId}/close/`, {});
  }

  /**
   * Get announcements
   * GET /announcements/
   */
  async getAnnouncements() {
    return this.get('announcements/');
  }

  /**
   * Contact support form
   * POST /support/contact/
   * Body: { name, email, subject, message }
   */
  async contactSupport(contactData) {
    return this.post('support/contact/', contactData);
  }

  // ============ API KEY ENDPOINTS ============

  /**
   * Get API keys
   * GET /api-keys/
   */
  async getApiKeys() {
    return this.get('api-keys/');
  }

  /**
   * Create API key
   * POST /api-keys/
   */
  async createApiKey() {
    return this.post('api-keys/', {});
  }

  // ============ SMS SERVICES ENDPOINTS ============

  /**
   * Get SMS number
   * POST /sms/get-number/
   * Body: { service, country, rent_time }
   */
  async getSmsNumber(service, country, rentTime = null) {
    const body = { service, country };
    if (rentTime) body.rent_time = rentTime;
    return this.post('sms/get-number/', body);
  }

  /**
   * Get SMS activation status
   * GET /sms/status/?id=X
   */
  async getSmsStatus(activationId) {
    return this.get(`sms/status/?id=${activationId}`);
  }

  /**
   * Set SMS activation status
   * POST /sms/set-status/
   * Body: { id, status } - status: 1=ready, 3=request another, 6=complete, 8=cancel
   */
  async setSmsStatus(activationId, status) {
    return this.post('sms/set-status/', { id: activationId, status });
  }

  /**
   * Get user SMS activations
   * GET /sms/activations/
   */
  async getSmsActivations() {
    return this.get('sms/activations/');
  }

  /**
   * Get user SMS rentals
   * GET /sms/rentals/
   */
  async getSmsRentals() {
    return this.get('sms/rentals/');
  }
}

export default new ApiService();