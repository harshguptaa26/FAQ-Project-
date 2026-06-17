// src/api/faq.js
//
// All HTTP calls to the backend live ONLY in this file.
// Components and hooks import from here — never call axios directly elsewhere.
//
// Backend contract: see README.md at repo root for full request/response shapes.

import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api'

/**
 * Get all FAQs, sorted by priority_score (backend handles sorting).
 * @returns {Promise<Array>} array of FAQ objects
 */
export const getFAQs = () => {
  return axios.get(`${BASE_URL}/faqs`).then(res => res.data)
}

/**
 * Get a single FAQ by id. Backend increments its priority_score (click tracking).
 * @param {string} id - FAQ id, e.g. "3.4"
 * @returns {Promise<Object>} single FAQ object
 */
export const getFAQById = (id) => {
  return axios.get(`${BASE_URL}/faqs/${id}`).then(res => res.data)
}

/**
 * Search FAQs by query string. Supports intent detection and typo correction.
 * @param {string} query - search text
 * @param {Object} [options]
 * @param {string} [options.category] - optional category filter
 * @param {number} [options.limit] - max results, default 10
 * @returns {Promise<{results: Array, intent: string|null, did_you_mean: string|null}>}
 */
export const searchFAQs = (query, options = {}) => {
  const params = { q: query }
  if (options.category) params.category = options.category
  if (options.limit) params.limit = options.limit

  return axios.get(`${BASE_URL}/search`, { params }).then(res => res.data)
}

/**
 * Submit a thumbs up / thumbs down vote on a FAQ.
 * @param {string} faqId
 * @param {"up"|"down"} type
 * @returns {Promise<{faq_id: string, new_priority_score: number, message: string}>}
 */
export const voteFAQ = (faqId, type) => {
  return axios.post(`${BASE_URL}/vote`, { faq_id: faqId, type }).then(res => res.data)
}

/**
 * Get the top 5 trending FAQs from the last 7 days.
 * @returns {Promise<{window_days: number, trending: Array}>}
 */
export const getTrending = () => {
  return axios.get(`${BASE_URL}/trending`).then(res => res.data)
}

/**
 * Get 3-4 FAQs similar to the given one (by tags + category).
 * @param {string} faqId
 * @returns {Promise<{faq_id: string, similar: Array}>}
 */
export const getSimilarFAQs = (faqId) => {
  return axios.get(`${BASE_URL}/similar/${faqId}`).then(res => res.data)
}