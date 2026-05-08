import axios from "axios";

/**
 * Dedicated axios instance for admin API calls.
 * Uses the same base URL as the main API but keeps admin
 * requests isolated so cookie headers stay separate.
 */
const adminApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin`,
  withCredentials: true, // sends admin_token cookie automatically
});

export default adminApi;
