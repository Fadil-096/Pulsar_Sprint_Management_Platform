/**
 * data.js — Nokia Sprint Platform Phase 2
 * ─────────────────────────────────────────
 * API Service Layer for frontend communicating with backend REST endpoints.
 */

const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('nokia_token');
  },
  
  setToken(token) {
    if (token) {
      localStorage.setItem('nokia_token', token);
    } else {
      localStorage.removeItem('nokia_token');
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('nokia_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('nokia_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nokia_user');
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        if (!endpoint.includes('/auth/login')) {
          this.setToken(null);
          this.setCurrentUser(null);
          if (window.renderLoginPage) {
            window.renderLoginPage();
          }
        }
      }
      throw new Error((data && data.error) || `HTTP Error ${response.status}`);
    }

    return data;
  },

  // Auth
  async login(email, password, role) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
    this.setToken(data.token);
    this.setCurrentUser(data.user);
    return data;
  },

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      this.setToken(null);
      this.setCurrentUser(null);
      window.renderLoginPage();
    }
  },

  async getMe() {
    const data = await this.request('/auth/me');
    this.setCurrentUser(data.user);
    return data.user;
  },

  // Users
  async getUsers() {
    return this.request('/users');
  },

  async getEmployees() {
    return this.request('/users/employees');
  },

  // Sprints
  async getSprints() {
    return this.request('/sprints');
  },

  async getSprintDetails(sprintId) {
    return this.request(`/sprints/${sprintId}`);
  },

  async getSprintStats(sprintId) {
    return this.request(`/sprints/${sprintId}/stats`);
  },

  async createSprint(sprintData) {
    return this.request('/sprints', {
      method: 'POST',
      body: JSON.stringify(sprintData)
    });
  },

  async updateSprintStatus(sprintId, status) {
    return this.request(`/sprints/${sprintId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Tasks
  async getTasks(sprintId) {
    const query = sprintId ? `?sprintId=${sprintId}` : '';
    return this.request(`/tasks${query}`);
  },

  async getEmployeeTasks(userId) {
    return this.request(`/tasks/employee/${userId}`);
  },

  async getTaskDetails(taskId) {
    return this.request(`/tasks/${taskId}`);
  },

  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },

  async updateTaskStatus(taskId, status) {
    return this.request(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Subtasks
  async getSubtasks(taskId) {
    return this.request(`/subtasks/task/${taskId}`);
  },

  async createSubtask(subtaskData) {
    return this.request('/subtasks', {
      method: 'POST',
      body: JSON.stringify(subtaskData)
    });
  },

  async updateSubtaskStatus(subtaskId, status) {
    return this.request(`/subtasks/${subtaskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Queries
  async raiseQuery(taskId, queryText) {
    return this.request('/queries', {
      method: 'POST',
      body: JSON.stringify({ taskId, queryText })
    });
  },

  async replyQuery(queryId, replyText) {
    return this.request(`/queries/${queryId}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ replyText })
    });
  },

  // Leaves
  async getLeaves(status = 'all') {
    return this.request(`/leaves?status=${status}`);
  },

  async getEmployeeLeaves(userId) {
    return this.request(`/leaves/employee/${userId}`);
  },

  async applyLeave(leaveData) {
    return this.request('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData)
    });
  },

  async updateLeaveStatus(leaveId, action) {
    // action is 'approve' or 'reject'
    return this.request(`/leaves/${leaveId}/${action}`, {
      method: 'PATCH'
    });
  },

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  },

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  },

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH'
    });
  },

  // Reports
  async getVelocityReport() {
    return this.request('/reports/velocity');
  },

  async getEstimationAccuracy() {
    return this.request('/reports/estimation-accuracy');
  },
  
  async getSprintReport(sprintId) {
    return this.request(`/reports/sprint/${sprintId}`);
  },
  
  async getEmployeeReport(employeeId) {
    return this.request(`/reports/employee/${employeeId}`);
  }
};

window.api = api;
