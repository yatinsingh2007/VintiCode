import axios from "axios";

/**
 * Dedicated axios instance for admin API calls.
 * Uses the same base URL as the main API but keeps admin
 * requests isolated so cookie headers stay separate.
 *
 * Interceptors:
 *   - Response: on 401 → redirect to /admin/login (expired/invalid session)
 */
const adminApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin`,
  withCredentials: true, // sends admin_token cookie automatically
});

// Auto-redirect on expired/invalid session
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/admin/login")
    ) {
      window.location.replace("/admin/login");
    }
    return Promise.reject(error);
  }
);

export default adminApi;
