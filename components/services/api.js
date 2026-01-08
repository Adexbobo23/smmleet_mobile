import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/apiUrls';

// Storage keys
const AUTH_TOKEN_KEY = '@smmleet_auth_token';
const USER_DATA_KEY = '@smmleet_user_data';
const SESSION_KEY = '@smmleet_session';

// SMS Cache keys
const SMS_SERVICES_CACHE = '@smmleet_sms_services';
const SMS_COUNTRIES_CACHE = '@smmleet_sms_countries';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    // SMS API uses v2 endpoint
    this.smsBaseURL = API_BASE_URL.replace('/api/v1/', '/api/v2/sms/');
  }

  // ============ TOKEN/SESSION MANAGEMENT ============
  async saveAuthData(token, userData, walletBalance = '0.00') {
    try {
      const authData = {
        user: userData,
        wallet_balance: walletBalance,
        logged_in_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
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
  async request(endpoint, options = {}, useBaseURL = true) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

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
      const baseUrl = useBaseURL ? this.baseURL : '';
      const url = `${baseUrl}${endpoint}`;
      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      console.log(`API Response (${response.status}):`, JSON.stringify(data).substring(0, 200));

      if (response.status === 401) {
        await this.clearAuthData();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
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

  // SMS-specific request method
  async smsRequest(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

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
      const url = `${this.smsBaseURL}${endpoint}`;
      console.log(`SMS API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      console.log(`SMS API Response (${response.status}):`, JSON.stringify(data).substring(0, 300));

      if (response.status === 401) {
        await this.clearAuthData();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        let errorMessage = data.error || data.message || data.detail || 'Request failed';
        const error = new Error(errorMessage);
        error.code = data.error_code;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`SMS API Error (${endpoint}):`, error.message);
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

  async logout() {
    try {
      await this.post('auth/logout/', {}).catch(() => {});
    } catch (error) {
      // Ignore logout API errors
    }
    await this.clearAuthData();
  }

  async requestPasswordReset(email) {
    return this.post('auth/password-reset/', { email });
  }

  async verifyPasswordResetOTP(email, otp) {
    return this.post('auth/password-reset/verify/', { email, otp });
  }

  async confirmPasswordReset(email, otp, newPassword, confirmPassword) {
    return this.post('auth/password-reset/confirm/', {
      email,
      otp,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  }

  async resendPasswordResetOTP(email) {
    return this.post('auth/password-reset/resend/', { email });
  }

  // ============ USER ENDPOINTS ============

  async getUserProfile() {
    return this.get('user/profile/');
  }

  async updateProfile(profileData) {
    const data = await this.patch('user/profile/update/', profileData);
    
    if (data && data.success) {
      const currentUser = await this.getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...profileData };
        await this.saveUser(updatedUser);
      }
    }
    
    return data;
  }

  async changePassword(oldPassword, newPassword, confirmPassword) {
    return this.post('user/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  }

  // ============ DASHBOARD ENDPOINTS ============

  async getDashboardStats() {
    return this.get('dashboard/stats/');
  }

  // ============ CATEGORIES ENDPOINTS ============

  async getCategories() {
    return this.get('categories/');
  }

  // ============ SERVICES ENDPOINTS ============

  async getServices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`services/${query ? '?' + query : ''}`);
  }

  async getServicesByCategory(categoryId) {
    return this.get(`services/by-category/?category_id=${categoryId}`);
  }

  async getServicesList() {
    return this.get('services/list/');
  }

  async getPopularServices() {
    return this.get('services/popular/');
  }

  async getFeaturedServices() {
    return this.get('services/featured/');
  }

  // ============ ORDERS ENDPOINTS ============

  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`orders/${query ? '?' + query : ''}`);
  }

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

  async getOrderStatus(orderId) {
    return this.get(`orders/${orderId}/status/`);
  }

  async getOrderStats() {
    return this.get('orders/stats/');
  }

  // ============ MASS ORDERS ENDPOINTS ============

  async validateMassOrders(ordersText) {
    return this.post('mass-orders/validate/', { orders_text: ordersText });
  }

  async createMassOrder(ordersText) {
    return this.post('mass-orders/create/', { orders_text: ordersText });
  }

  async getMassOrderStatus(batchId) {
    return this.get(`mass-orders/${batchId}/status/`);
  }

  async getMassOrderDetails(batchId) {
    return this.get(`mass-orders/${batchId}/`);
  }

  // ============ WALLET ENDPOINTS ============

  async getWalletBalance() {
    return this.get('wallet/balance/');
  }

  async getWalletSummary() {
    return this.get('wallet/summary/');
  }

  async getTransactions(type = null, limit = 50) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit.toString());
    return this.get(`wallet/transactions/?${params.toString()}`);
  }

  async getCryptoAddresses() {
    return this.get('wallet/addresses/');
  }

  async createCryptoAddress(currency = 'USDT', network = 'tron') {
    return this.post('wallet/addresses/create/', { currency, network });
  }

  async getWithdrawals() {
    return this.get('wallet/withdrawals/');
  }

  async createWithdrawal(withdrawalData) {
    return this.post('wallet/withdrawals/create/', {
      amount: withdrawalData.amount,
      crypto_currency: withdrawalData.crypto_currency,
      network: withdrawalData.network,
      recipient_address: withdrawalData.recipient_address,
    });
  }

  // ============ PAYMENT ENDPOINTS ============

  async calculateBonus(amount) {
    return this.post('payments/calculate-bonus/', { amount: parseFloat(amount) });
  }

  async createPayment(paymentData) {
    return this.post('payments/create/', {
      amount: parseFloat(paymentData.amount),
      payment_method: paymentData.payment_method,
      currency: paymentData.currency || 'USDT',
      network: paymentData.network || 'tron',
    });
  }

  async getPaymentStatus(orderId) {
    return this.get(`payments/${orderId}/status/`);
  }

  // ============ SUPPORT ENDPOINTS ============

  async getTickets() {
    return this.get('tickets/');
  }

  async createTicket(ticketData) {
    return this.post('tickets/', {
      subject: ticketData.subject,
      order_id: ticketData.order_id,
      priority: ticketData.priority || 'medium',
      initial_message: ticketData.message || ticketData.initial_message,
    });
  }

  async getTicketDetails(ticketId) {
    return this.get(`tickets/${ticketId}/`);
  }

  async addTicketMessage(ticketId, message) {
    return this.post(`tickets/${ticketId}/add_message/`, { message });
  }

  async closeTicket(ticketId) {
    return this.post(`tickets/${ticketId}/close/`, {});
  }

  async getAnnouncements() {
    return this.get('announcements/');
  }

  async contactSupport(contactData) {
    return this.post('support/contact/', contactData);
  }

  // ============ API KEY ENDPOINTS ============

  async getApiKeys() {
    return this.get('api-keys/');
  }

  async createApiKey() {
    return this.post('api-keys/', {});
  }

  // ============ SMS V2 ACTIVATION ENDPOINTS ============

  /**
   * Get available SMS services
   * GET /api/v2/sms/services/
   * Returns: { status, services: [{code, name}], count }
   */
  async getSmsServices(forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(SMS_SERVICES_CACHE);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache valid for 24 hours
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            return data;
          }
        }
      }
      
      const data = await this.smsRequest('services/');
      
      // Cache the response
      await AsyncStorage.setItem(SMS_SERVICES_CACHE, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      return data;
    } catch (error) {
      // Try to return cached data on error
      const cached = await AsyncStorage.getItem(SMS_SERVICES_CACHE);
      if (cached) {
        return JSON.parse(cached).data;
      }
      throw error;
    }
  }

  /**
   * Get available SMS countries
   * GET /api/v2/sms/countries/
   * Returns: { status, countries: [{code, name, phone_code}], count }
   */
  async getSmsCountries(forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(SMS_COUNTRIES_CACHE);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache valid for 24 hours
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            return data;
          }
        }
      }
      
      const data = await this.smsRequest('countries/');
      
      // Cache the response
      await AsyncStorage.setItem(SMS_COUNTRIES_CACHE, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      return data;
    } catch (error) {
      // Try to return cached data on error
      const cached = await AsyncStorage.getItem(SMS_COUNTRIES_CACHE);
      if (cached) {
        return JSON.parse(cached).data;
      }
      throw error;
    }
  }

  /**
   * Get SMS prices
   * GET /api/v2/sms/prices/?service=tg&country=12
   */
  async getSmsPrices(service, country) {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    if (country) params.append('country', country);
    return this.smsRequest(`prices/?${params.toString()}`);
  }

  /**
   * Request activation number
   * POST /api/v2/sms/activate/
   * Body: { service, country, max_price? }
   */
  async activateNumber(service, country, maxPrice = null) {
    const body = { service, country };
    if (maxPrice) body.max_price = maxPrice;
    return this.smsRequest('activate/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Check activation status
   * GET /api/v2/sms/activation/{id}/status/
   */
  async checkActivationStatus(activationId) {
    return this.smsRequest(`activation/${activationId}/status/`);
  }

  /**
   * Mark activation as ready (SMS sent)
   * POST /api/v2/sms/activation/{id}/ready/
   */
  async markActivationReady(activationId) {
    return this.smsRequest(`activation/${activationId}/ready/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Request retry code
   * POST /api/v2/sms/activation/{id}/retry/
   */
  async retryActivation(activationId) {
    return this.smsRequest(`activation/${activationId}/retry/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Complete activation
   * POST /api/v2/sms/activation/{id}/complete/
   */
  async completeActivation(activationId) {
    return this.smsRequest(`activation/${activationId}/complete/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Cancel activation
   * POST /api/v2/sms/activation/{id}/cancel/
   */
  async cancelActivation(activationId) {
    return this.smsRequest(`activation/${activationId}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * List active activations
   * GET /api/v2/sms/activations/?status=waiting_code&service=tg&page=1
   */
  async getSmsActivations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.smsRequest(`activations/${query ? '?' + query : ''}`);
  }

  /**
   * Get activation history
   * GET /api/v2/sms/activation-history/?status=completed&search=+1202&page=1
   */
  async getSmsActivationHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.smsRequest(`activation-history/${query ? '?' + query : ''}`);
  }

  // ============ SMS V2 RENTAL ENDPOINTS ============

  /**
   * Rent a number
   * POST /api/v2/sms/rent/
   * Body: { service, country, rent_time }
   */
  async rentNumber(service, country, rentTime) {
    return this.smsRequest('rent/', {
      method: 'POST',
      body: JSON.stringify({ service, country, rent_time: rentTime }),
    });
  }

  /**
   * Check rental status
   * GET /api/v2/sms/rental/{id}/status/
   */
  async checkRentalStatus(rentId) {
    return this.smsRequest(`rental/${rentId}/status/`);
  }

  /**
   * Extend/continue rental
   * POST /api/v2/sms/rental/{id}/continue/
   * Body: { rent_time }
   */
  async continueRental(rentId, rentTime) {
    return this.smsRequest(`rental/${rentId}/continue/`, {
      method: 'POST',
      body: JSON.stringify({ rent_time: rentTime }),
    });
  }

  /**
   * Finish rental
   * POST /api/v2/sms/rental/{id}/finish/
   */
  async finishRental(rentId) {
    return this.smsRequest(`rental/${rentId}/finish/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Cancel rental
   * POST /api/v2/sms/rental/{id}/cancel/
   */
  async cancelRental(rentId) {
    return this.smsRequest(`rental/${rentId}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Get rental extension history
   * GET /api/v2/sms/rental/{id}/history/
   */
  async getRentalExtensionHistory(rentId) {
    return this.smsRequest(`rental/${rentId}/history/`);
  }

  /**
   * List active rentals
   * GET /api/v2/sms/rentals/?status=active&service=tg&page=1
   */
  async getSmsRentals(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.smsRequest(`rentals/${query ? '?' + query : ''}`);
  }

  /**
   * Get rental history
   * GET /api/v2/sms/rental-history/?status=expired&page=1
   */
  async getSmsRentalHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.smsRequest(`rental-history/${query ? '?' + query : ''}`);
  }

  // ============ SMS HELPER METHODS ============

  /**
   * Clear SMS cache (services and countries)
   */
  async clearSmsCache() {
    try {
      await AsyncStorage.multiRemove([SMS_SERVICES_CACHE, SMS_COUNTRIES_CACHE]);
    } catch (error) {
      console.error('Error clearing SMS cache:', error);
    }
  }
}

export default new ApiService();