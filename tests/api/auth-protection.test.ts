/**
 * Tests that all protected API routes return 401 when called without authentication.
 * This is the most critical security test — if any of these fail, we have an open endpoint.
 */
import { describe, it, expect } from 'vitest';
import { api } from '../helpers/auth';

const PROTECTED_GET_ROUTES = [
  '/api/dashboard?type=creator&creatorId=test',
  '/api/favorites?businessId=test',
  '/api/creator-views?businessId=test',
  '/api/job-applications?creatorId=test',
  '/api/job-invitations?creatorId=test',
  '/api/job-messages?applicationId=test',
  '/api/saved-jobs?creatorId=test',
  '/api/stripe/subscription-status?businessId=test',
  '/api/admin/creators',
  '/api/admin/businesses',
  // /api/admin/jobs has no GET handler (405), tested separately
  '/api/admin/categories',
  '/api/businesses',
];

const PROTECTED_POST_ROUTES = [
  { path: '/api/jobs', body: { title: 'test' } },
  { path: '/api/reviews', body: { creatorId: 'test', rating: 5, comment: 'test' } },
  { path: '/api/favorites', body: { businessId: 'test', creatorId: 'test' } },
  { path: '/api/job-applications', body: { jobId: 'test' } },
  { path: '/api/job-invitations', body: { jobId: 'test', creatorId: 'test' } },
  { path: '/api/job-messages', body: { applicationId: 'test', message: 'test' } },
  { path: '/api/saved-jobs', body: { creatorId: 'test', jobId: 'test' } },
  { path: '/api/stripe/cancel-subscription', body: { businessId: 'test' } },
  { path: '/api/stripe/reactivate-subscription', body: { businessId: 'test' } },
  { path: '/api/stripe/change-plan', body: { businessId: 'test', newPlan: 'yearly' } },
  { path: '/api/stripe/create-portal', body: { businessId: 'test' } },
  { path: '/api/subscription/renew', body: { businessId: 'test' } },
  { path: '/api/notifications', body: { type: 'test' } },
  { path: '/api/reviews/fake-id/approve', body: {} },
  { path: '/api/reviews/fake-id/reject', body: {} },
  // /api/admin/creators and /api/admin/businesses have no POST handler (405)
  { path: '/api/admin/categories', body: { name: 'test' } },
];

describe('Auth Protection — GET routes return 401 without auth', () => {
  for (const route of PROTECTED_GET_ROUTES) {
    it(`GET ${route.split('?')[0]}`, async () => {
      const res = await fetch(api(route));
      expect(res.status).toBe(401);
    });
  }
});

describe('Auth Protection — POST routes return 401 without auth', () => {
  for (const { path, body } of PROTECTED_POST_ROUTES) {
    it(`POST ${path}`, async () => {
      const res = await fetch(api(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(res.status).toBe(401);
    });
  }
});

describe('Auth Protection — PUT/DELETE routes return 401 without auth', () => {
  const routes = [
    { method: 'PUT', path: '/api/jobs', body: { jobId: 'test', status: 'open' } },
    { method: 'DELETE', path: '/api/jobs', body: { jobId: 'test' } },
    { method: 'PUT', path: '/api/reviews/fake-id', body: { rating: 5 } },
    { method: 'DELETE', path: '/api/reviews/fake-id', body: {} },
    { method: 'DELETE', path: '/api/favorites', body: { businessId: 'test', creatorId: 'test' } },
    { method: 'DELETE', path: '/api/saved-jobs', body: { creatorId: 'test', jobId: 'test' } },
    { method: 'PUT', path: '/api/admin/creators', body: { creatorId: 'test' } },
    { method: 'DELETE', path: '/api/admin/creators', body: { creatorId: 'test' } },
    { method: 'PUT', path: '/api/admin/businesses', body: { businessId: 'test' } },
    { method: 'DELETE', path: '/api/admin/businesses', body: { businessId: 'test' } },
  ];

  for (const { method, path, body } of routes) {
    it(`${method} ${path}`, async () => {
      const res = await fetch(api(path), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(res.status).toBe(401);
    });
  }
});
